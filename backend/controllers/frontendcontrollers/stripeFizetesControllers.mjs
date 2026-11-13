import mongoose from 'mongoose';
import Stripe from 'stripe';
import RendelesModel, { fizetesPotolhato } from '../../models/Rendeles.mjs';
import { hatterben, rendelesErtesitesek } from '../../utils/ertesitesek.mjs';
import { keszletVisszaadas } from '../../utils/keszlet.mjs';

const stripePeldany = () => {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('A Stripe nincs beállítva.');
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const fizetesSikeres = async (session) => {
    if (session.payment_status !== 'paid' || !mongoose.isValidObjectId(session.metadata?.orderId)) return null;

    const rendeles = await RendelesModel.findOne({
        _id: session.metadata.orderId,
        stripeSessionId: session.id,
    });
    if (!rendeles || session.currency !== 'huf' || session.amount_total !== Math.round(rendeles.vegosszeg)) return null;
    if (rendeles.fizetesiAllapot === 'fizetve') return rendeles;
    if (rendeles.fizetesiAllapot !== 'fizetesre_var') return null;

    const frissitett = await RendelesModel.findOneAndUpdate(
        { _id: rendeles._id, stripeSessionId: session.id, fizetesiAllapot: 'fizetesre_var' },
        { $set: { fizetesiAllapot: 'fizetve', fizetve: new Date() } },
        { new: true, runValidators: true },
    );
    if (frissitett) {
        hatterben(() => rendelesErtesitesek(frissitett._id), 'Fizetett rendelés értesítése');
        return frissitett;
    }
    // Párhuzamos webhook és visszatérő böngésző esetén a második kérés is
    // sikeres visszaigazolást kapjon, de értesítést csak az első küldjön.
    return RendelesModel.findOne({ _id: rendeles._id, stripeSessionId: session.id, fizetesiAllapot: 'fizetve' });
};

const fizetesLejart = async (session) => {
    if (!mongoose.isValidObjectId(session.metadata?.orderId)) return false;
    const rendeles = await RendelesModel.findOneAndUpdate(
        {
            _id: session.metadata.orderId,
            stripeSessionId: session.id,
            fizetesiAllapot: 'fizetesre_var',
            allapot: 'feldolgozasra_var',
        },
        {
            $set: { fizetesiAllapot: 'fizetes_lejart', allapot: 'lemondva' },
            $push: { allapotTortenet: { allapot: 'lemondva', datum: new Date(), megjegyzes: 'Az online fizetési munkamenet lejárt.' } },
        },
        { new: true, runValidators: true },
    );
    if (!rendeles) return false;
    await keszletVisszaadas(rendeles.tetelek);
    return true;
};

const getStripeFizetesEllenorzes = async (req, res) => {
    try {
        const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
        if (!sessionId || sessionId.length > 255) return res.status(400).json({ msg: 'Hiányzó vagy érvénytelen fizetési azonosító.' });

        const session = await stripePeldany().checkout.sessions.retrieve(sessionId);
        const rendeles = await fizetesSikeres(session);
        if (!rendeles) return res.status(409).json({ msg: 'A fizetést még nem igazolta vissza a Stripe.' });
        return res.status(200).json({
            msg: 'A fizetés sikeres.',
            rendeles: {
                id: rendeles._id,
                vegosszeg: rendeles.vegosszeg,
                // Ebből tudja a frontend, mely tételeket vegye ki a kosárból.
                tetelek: rendeles.tetelek.map(({ termekId, mennyiseg }) => ({ termekId, mennyiseg })),
            },
        });
    } catch (error) {
        console.error('Stripe fizetés-ellenőrzési hiba:', error.message);
        return res.status(500).json({ msg: 'A fizetés állapotát most nem sikerült ellenőrizni.' });
    }
};

// A pénztárban megkezdett, de be nem fejezett bankkártyás fizetés folytatása a profilból.
// Új fizetési munkamenetet szándékosan nem nyitunk: a készlet csak a határidőig van
// lefoglalva, a lejárt rendelést a vevő az „Újrarendelem” gombbal adhatja le újra.
const postFizetesFolytatas = async (req, res) => {
    try {
        const { id } = req.params;
        const rendeles = mongoose.isValidObjectId(id)
            ? await RendelesModel.findOne({ _id: id, userId: req.authUser._id }).lean()
            : null;
        if (!rendeles) return res.status(404).json({ msg: 'A rendelés nem található.' });
        if (rendeles.fizetesiAllapot === 'fizetve') return res.status(409).json({ msg: 'Ezt a rendelést már kifizetted.' });
        if (!fizetesPotolhato(rendeles)) {
            return res.status(409).json({ msg: 'Ennél a rendelésnél már nem indítható bankkártyás fizetés.' });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(503).json({ msg: 'Az online bankkártyás fizetés nincs beállítva a szerveren.' });
        }

        const session = await stripePeldany().checkout.sessions.retrieve(rendeles.stripeSessionId);
        if (session.payment_status === 'paid') {
            await fizetesSikeres(session);
            return res.status(200).json({ fizetve: true, msg: 'A fizetésed közben megérkezett, a rendelést kifizetettként rögzítettük.' });
        }
        if (session.status === 'open' && session.url) {
            return res.status(200).json({ fizetesiUrl: session.url });
        }
        if (session.status === 'expired') {
            await fizetesLejart(session);
            return res.status(410).json({
                msg: 'A fizetési határidő lejárt, ezért a rendelést lemondtuk, és a tételeket felszabadítottuk. Az „Újrarendelem” gombbal újra kosárba teheted őket.',
            });
        }
        return res.status(409).json({ msg: 'A fizetés feldolgozás alatt áll, kérjük, nézz vissza pár perc múlva.' });
    } catch (error) {
        console.error('Stripe fizetés-folytatási hiba:', error.message);
        return res.status(500).json({ msg: 'A fizetést most nem sikerült megnyitni. Próbáld újra később.' });
    }
};

/**
 * Vevői lemondás előtt lezárja a rendelés még nyitott fizetési munkamenetét, hogy a
 * lemondott rendelést már ne lehessen kifizetni. Ha a fizetés közben megérkezett,
 * azt rögzíti, és `fizetve: true` értékkel jelzi.
 */
export const fuggoFizetesLezarasa = async (rendeles) => {
    const stripe = stripePeldany();
    const session = await stripe.checkout.sessions.retrieve(rendeles.stripeSessionId);
    if (session.payment_status === 'paid') {
        await fizetesSikeres(session);
        return { fizetve: true };
    }
    if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
    return { fizetve: false };
};

const postStripeFizetesMegszakit = async (req, res) => {
    try {
        const sessionId = typeof req.body?.session_id === 'string' ? req.body.session_id : '';
        if (!sessionId || sessionId.length > 255) return res.status(400).json({ msg: 'Hiányzó vagy érvénytelen fizetési azonosító.' });

        const stripe = stripePeldany();
        let session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!mongoose.isValidObjectId(session.metadata?.orderId)) return res.status(404).json({ msg: 'A rendelés nem található.' });
        const rendeles = await RendelesModel.findOne({ _id: session.metadata.orderId, stripeSessionId: session.id });
        if (!rendeles) return res.status(404).json({ msg: 'A rendelés nem található.' });
        if (session.payment_status === 'paid') return res.status(409).json({ msg: 'A fizetés már megtörtént.' });

        if (session.status === 'open') {
            session = await stripe.checkout.sessions.expire(session.id);
        }
        if (session.status === 'expired') await fizetesLejart(session);
        return res.status(200).json({ msg: 'A fizetési folyamat megszakadt. A kosár tartalma megmaradt.' });
    } catch (error) {
        console.error('Stripe fizetés-megszakítási hiba:', error.message);
        return res.status(500).json({ msg: 'A fizetési munkamenetet most nem sikerült lezárni.' });
    }
};

const stripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
        return res.status(400).send('Stripe webhook nincs megfelelően beállítva.');
    }

    let event;
    try {
        event = stripePeldany().webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        console.error('Stripe webhook aláírás-hiba:', error.message);
        return res.status(400).send('Érvénytelen Stripe aláírás.');
    }

    try {
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            await fizetesSikeres(event.data.object);
        } else if (event.type === 'checkout.session.expired') {
            await fizetesLejart(event.data.object);
        }
        return res.sendStatus(200);
    } catch (error) {
        console.error('Stripe webhook feldolgozási hiba:', error.message);
        return res.sendStatus(500);
    }
};

export { getStripeFizetesEllenorzes, postFizetesFolytatas, postStripeFizetesMegszakit, stripeWebhook };
