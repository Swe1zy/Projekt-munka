import mongoose from 'mongoose';
import Stripe from 'stripe';
import RendelesModel from '../../models/Rendeles.mjs';
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
            rendeles: { id: rendeles._id, vegosszeg: rendeles.vegosszeg },
        });
    } catch (error) {
        console.error('Stripe fizetés-ellenőrzési hiba:', error.message);
        return res.status(500).json({ msg: 'A fizetés állapotát most nem sikerült ellenőrizni.' });
    }
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

export { getStripeFizetesEllenorzes, postStripeFizetesMegszakit, stripeWebhook };
