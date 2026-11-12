import { DIJBEKERO, ELADO, KISZALLITAS, NYITVATARTAS, TELEPHELY } from '../config/uzlet.mjs';
import { ATVETELI_MODOK } from '../models/Rendeles.mjs';
import { rovidAzonosito } from './rendelesFormazas.mjs';

// A levelekben szereplő vásárlói adatokat (név, cím, megjegyzés) mindig escape-eljük.
const esc = (szoveg) => String(szoveg ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const forintFormazo = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });
const szamFormazo = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
const datumFormazo = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const idopontFormazo = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const forint = (ertek) => forintFormazo.format(ertek || 0);
const szam = (ertek) => szamFormazo.format(ertek || 0);
const napKulcs = (kulcs) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return datumFormazo.format(new Date(Date.UTC(ev, honap - 1, nap, 12)));
};
const HET_NAPJAI = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const SZIN = { tinta: '#17352b', halvany: '#6b7a72', vonal: '#e2e8df', hatter: '#f5f6f1', narancs: '#c65a24' };

const keret = (tartalom) => `<!doctype html>
<html lang="hu"><body style="margin:0;padding:24px;background:${SZIN.hatter};font-family:Arial,Helvetica,sans-serif;color:#2c3a33;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${SZIN.vonal};border-radius:12px;">
<tr><td style="padding:28px 28px 8px;"><div style="font-size:12px;letter-spacing:2px;font-weight:bold;color:${SZIN.narancs};">${esc(TELEPHELY.nev.toUpperCase())}</div></td></tr>
<tr><td style="padding:0 28px 28px;font-size:14px;line-height:1.55;">${tartalom}</td></tr>
</table>
<p style="max-width:640px;margin:16px auto 0;font-size:11px;color:${SZIN.halvany};text-align:center;">${esc(ELADO.nev)} · ${esc(TELEPHELY.cim)} · ${esc(TELEPHELY.telefon)}</p>
</body></html>`;

const tetelTablazat = (rendeles) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin:12px 0;">
<tr style="background:${SZIN.tinta};color:#ffffff;">
<th align="left" style="padding:8px;">Termék</th><th align="right" style="padding:8px;">Mennyiség</th><th align="right" style="padding:8px;">Összeg</th></tr>
${rendeles.tetelek.map((tetel) => `<tr>
<td style="padding:8px;border-bottom:1px solid ${SZIN.vonal};">${esc(tetel.nev)}</td>
<td align="right" style="padding:8px;border-bottom:1px solid ${SZIN.vonal};white-space:nowrap;">${szam(tetel.mennyiseg)} ${esc(tetel.egyseg)}</td>
<td align="right" style="padding:8px;border-bottom:1px solid ${SZIN.vonal};white-space:nowrap;">${forint(tetel.mennyiseg * tetel.egysegar)}</td></tr>`).join('')}
</table>`;

const osszesitoSorok = (rendeles) => {
    const o = rendeles.osszesites;
    if (!o) return [['Végösszeg', forint(rendeles.vegosszeg)]];
    return [
        ['Termékek', forint(o.termekOsszeg)],
        o.kedvezmeny > 0 ? [`Céges mennyiségi kedvezmény (${szam(o.kedvezmenySzazalek)}%)`, `−${forint(o.kedvezmeny)}`] : null,
        rendeles.atvetelModja === 'hazhozszallitas' ? ['Szállítás', forint(o.szallitas?.alapdij ?? o.szallitasiDij)] : null,
        o.szallitas?.darus ? ['Darus lerakodás', forint(o.szallitas.darusPotdij)] : null,
        o.raklapBetetdij > 0 ? [`Raklap-betétdíj (${szam(o.raklapok)} raklap, visszajár)`, forint(o.raklapBetetdij)] : null,
    ].filter(Boolean);
};

const osszesitoHtml = (rendeles) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
${osszesitoSorok(rendeles).map(([cimke, ertek]) => `<tr><td style="padding:3px 0;color:${SZIN.halvany};">${esc(cimke)}</td><td align="right" style="padding:3px 0;">${esc(ertek)}</td></tr>`).join('')}
<tr><td style="padding:10px 0 0;border-top:2px solid ${SZIN.tinta};font-weight:bold;font-size:15px;">Fizetendő</td>
<td align="right" style="padding:10px 0 0;border-top:2px solid ${SZIN.tinta};font-weight:bold;font-size:15px;">${forint(rendeles.vegosszeg)}</td></tr>
</table>`;

const atvetelSzoveg = (rendeles) => {
    const idosav = KISZALLITAS.idosavok.find((sav) => sav.kulcs === rendeles.idosav)?.cimke;
    const nap = rendeles.atvetelNapja ? `${napKulcs(rendeles.atvetelNapja)}${idosav ? `, ${idosav}` : ''}` : 'egyeztetés szerint';
    if (rendeles.atvetelModja === 'hazhozszallitas' && rendeles.szallitasiAdatok) {
        const c = rendeles.szallitasiAdatok;
        return { cim: 'Házhozszállítás', nap, hely: `${c.atvevoNev}, ${c.iranyitoszam} ${c.telepules}, ${c.utca}` };
    }
    return { cim: 'Személyes átvétel', nap, hely: `${TELEPHELY.nev}, ${TELEPHELY.cim}` };
};

const nyitvatartasSzoveg = () => NYITVATARTAS
    .filter((nap) => !nap.zarva)
    .map((nap) => `${HET_NAPJAI[nap.nap]} ${nap.nyit}–${nap.zar}`)
    .join(', ');

export const vevoLevel = (rendeles) => {
    const azonosito = rovidAzonosito(rendeles._id);
    const atvetel = atvetelSzoveg(rendeles);
    const profilLink = rendeles.userId ? `${frontendUrl()}/profil#rendeleseim` : null;
    const html = keret(`
<h1 style="margin:8px 0 12px;font-size:22px;color:${SZIN.tinta};">Köszönjük a rendelésed!</h1>
<p>Kedves ${esc(rendeles.szamlazasiAdatok.nev)}!</p>
<p>Megkaptuk a <strong>#${azonosito}</strong> azonosítójú rendelésedet. A tételeket lefoglaltuk, hamarosan visszaigazoljuk.</p>
<div style="margin:16px 0;padding:12px 14px;background:${SZIN.hatter};border-radius:8px;">
<strong>${esc(atvetel.cim)}:</strong> ${esc(atvetel.nap)}<br>${esc(atvetel.hely)}
${rendeles.atvetelModja === 'szemelyes_atvetel' ? `<br><span style="color:${SZIN.halvany};font-size:12px;">Nyitvatartás: ${esc(nyitvatartasSzoveg())}</span>` : ''}
</div>
${tetelTablazat(rendeles)}
${osszesitoHtml(rendeles)}
<p style="margin-top:18px;">A díjbekérőt csatoltuk. Kérjük, a végösszeget ${DIJBEKERO.fizetesiHataridoNap} napon belül utald át a(z) <strong>${esc(ELADO.bankszamla)}</strong> számlaszámra, közleményként a <strong>${azonosito}</strong> azonosítót megadva.</p>
${profilLink ? `<p><a href="${esc(profilLink)}" style="color:${SZIN.narancs};font-weight:bold;">Rendelésed állapota a profilodban →</a></p>` : ''}
<p style="color:${SZIN.halvany};font-size:12px;">Kérdés esetén válaszolj erre a levélre, vagy hívj minket: ${esc(TELEPHELY.telefon)}.</p>`);

    const szoveg = [
        `Köszönjük a rendelésed! (#${azonosito})`,
        '',
        `${atvetel.cim}: ${atvetel.nap}`,
        atvetel.hely,
        '',
        ...rendeles.tetelek.map((tetel) => `- ${tetel.nev}: ${szam(tetel.mennyiseg)} ${tetel.egyseg} – ${forint(tetel.mennyiseg * tetel.egysegar)}`),
        '',
        ...osszesitoSorok(rendeles).map(([cimke, ertek]) => `${cimke}: ${ertek}`),
        `Fizetendő: ${forint(rendeles.vegosszeg)}`,
        '',
        `Utalás: ${ELADO.bankszamla}, közlemény: ${azonosito}, határidő: ${DIJBEKERO.fizetesiHataridoNap} nap.`,
        profilLink ? `Rendelésed állapota: ${profilLink}` : '',
    ].join('\n');

    return { targy: `Rendelés visszaigazolás – #${azonosito}`, html, szoveg };
};

export const boltLevel = (rendeles) => {
    const azonosito = rovidAzonosito(rendeles._id);
    const atvetel = atvetelSzoveg(rendeles);
    const sz = rendeles.szamlazasiAdatok;
    const adminLink = `${frontendUrl()}/admin/rendelesek?allapot=feldolgozasra_var`;
    const html = keret(`
<h1 style="margin:8px 0 12px;font-size:20px;color:${SZIN.tinta};">Új rendelés: #${azonosito}</h1>
<p><strong>${esc(sz.nev)}</strong>${sz.tipus === 'ceg' ? ` (cég, adószám: ${esc(sz.adoszam)})` : ''}<br>
<a href="mailto:${esc(rendeles.email)}">${esc(rendeles.email)}</a> · ${rendeles.userId ? 'regisztrált vásárló' : 'vendég'}<br>
<span style="color:${SZIN.halvany};">Leadva: ${esc(idopontFormazo.format(new Date(rendeles.createdAt)))}</span></p>
<div style="margin:12px 0;padding:12px 14px;background:${SZIN.hatter};border-radius:8px;">
<strong>${esc(atvetel.cim)}:</strong> ${esc(atvetel.nap)}<br>${esc(atvetel.hely)}
${rendeles.szallitasiAdatok?.megjegyzes ? `<br>Futárnak: ${esc(rendeles.szallitasiAdatok.megjegyzes)}` : ''}
${rendeles.osszesites?.sulyKg ? `<br><span style="color:${SZIN.halvany};">Tömeg: ${szam(rendeles.osszesites.sulyKg)} kg${rendeles.osszesites.szallitas ? `, ${esc(rendeles.osszesites.szallitas.jarmu)}, ${rendeles.osszesites.szallitas.fuvarok} forduló${rendeles.osszesites.szallitas.darus ? ', darus' : ''}` : ''}</span>` : ''}
</div>
${sz.megjegyzes ? `<p><strong>Megjegyzés:</strong> ${esc(sz.megjegyzes)}</p>` : ''}
${tetelTablazat(rendeles)}
${osszesitoHtml(rendeles)}
<p style="margin-top:18px;"><a href="${esc(adminLink)}" style="color:${SZIN.narancs};font-weight:bold;">Rendelés kezelése →</a></p>`);

    const szoveg = [
        `Új rendelés: #${azonosito}`,
        `${sz.nev} <${rendeles.email}>`,
        `${atvetel.cim}: ${atvetel.nap} – ${atvetel.hely}`,
        ...rendeles.tetelek.map((tetel) => `- ${tetel.nev}: ${szam(tetel.mennyiseg)} ${tetel.egyseg}`),
        `Fizetendő: ${forint(rendeles.vegosszeg)}`,
        adminLink,
    ].join('\n');

    return { targy: `Új rendelés #${azonosito} – ${sz.nev} – ${forint(rendeles.vegosszeg)}`, html, szoveg };
};

export const keszletLevel = (termekek, kuszob) => {
    const elfogyott = termekek.filter((termek) => termek.uj <= 0).length;
    const html = keret(`
<h1 style="margin:8px 0 12px;font-size:20px;color:${SZIN.tinta};">Készletriasztás</h1>
<p>Az imént leadott rendelés után ${termekek.length} termék készlete legfeljebb ${kuszob} egységre csökkent${elfogyott ? `, ebből ${elfogyott} elfogyott` : ''}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin:12px 0;">
<tr style="background:${SZIN.tinta};color:#ffffff;"><th align="left" style="padding:8px;">Termék</th><th align="right" style="padding:8px;">Maradt</th><th align="left" style="padding:8px;">Állapot</th></tr>
${termekek.map((termek) => `<tr>
<td style="padding:8px;border-bottom:1px solid ${SZIN.vonal};">${esc(termek.nev)}</td>
<td align="right" style="padding:8px;border-bottom:1px solid ${SZIN.vonal};white-space:nowrap;">${szam(termek.uj)} ${esc(termek.egyseg)}</td>
<td style="padding:8px;border-bottom:1px solid ${SZIN.vonal};font-weight:bold;color:${termek.uj <= 0 ? '#b42318' : '#9a5b00'};">${termek.uj <= 0 ? '✕ Elfogyott' : '⚠ Fogyóban'}</td></tr>`).join('')}
</table>
<p><a href="${esc(`${frontendUrl()}/admin/termekek`)}" style="color:${SZIN.narancs};font-weight:bold;">Készlet feltöltése →</a></p>`);

    const szoveg = [
        'Készletriasztás',
        ...termekek.map((termek) => `- ${termek.nev}: ${szam(termek.uj)} ${termek.egyseg}${termek.uj <= 0 ? ' (ELFOGYOTT)' : ''}`),
        `${frontendUrl()}/admin/termekek`,
    ].join('\n');

    return {
        targy: elfogyott ? `Készletriasztás: ${elfogyott} termék elfogyott` : `Készletriasztás: ${termekek.length} termék fogyóban`,
        html,
        szoveg,
    };
};
