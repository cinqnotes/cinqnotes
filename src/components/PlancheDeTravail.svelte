<script lang="ts">
  import Clavier from "~/components/Clavier.svelte";
  import Metronome from "~/components/Metronome.svelte";
  import { exercice as exercicePar } from "~/content/curriculum/exercices";
  import { JOURS_ORDONNES, PHASE_1, dureeDuJour, jour as jourPar } from "~/content/curriculum/phase1";
  import {
    ancienneteEnJours,
    cleDeJourDeSemaine,
    paliersDeRetour,
    semaineCourante,
    serie,
  } from "~/lib/horloge";
  import { mesurer, mesurerDebutDeSeance, mesurerUneFois } from "~/lib/mesure";
  import {
    ecrire,
    ecrivainDiffere,
    joursPratiques,
    journee,
    lire,
    type EtatPratique,
  } from "~/lib/stockage";

  interface Props {
    /** Jour rendu au build. À l'hydratation, on bascule sur le jour réel. */
    jourInitial?: number;
  }

  let { jourInitial = 1 }: Props = $props();

  let jourAffiche = $state(jourInitial);
  let etat = $state<EtatPratique>({});
  let hydrate = $state(false);
  let messageSauvegarde = $state("");
  let blocSelectionne = $state(0);

  /* Chronomètre du bloc */
  let restant = $state(0);
  let blocChronometre = $state(-1);
  let chronoActif = $state(false);

  const enregistrer = ecrivainDiffere();

  const leJour = $derived(jourPar(jourAffiche) ?? PHASE_1.days[0]!);
  const total = $derived(dureeDuJour(jourAffiche));
  const cleDuJourAffiche = $derived(hydrate ? cleDeJourDeSemaine(jourAffiche) : "");
  const faits = $derived(
    hydrate && cleDuJourAffiche ? (etat[cleDuJourAffiche]?.done ?? []) : [],
  );
  const avancement = $derived(
    leJour.blocks.length ? (faits.length / leJour.blocks.length) * 100 : 0,
  );
  const exerciceAffiche = $derived.by(() => {
    const id = leJour.blocks[blocSelectionne]?.exerciseId;
    return id ? exercicePar(id) : undefined;
  });

  const jours = $derived(hydrate ? joursPratiques(etat) : new Set<string>());
  const serieEnCours = $derived(hydrate ? serie(jours) : 0);
  const semaine = $derived(
    hydrate ? semaineCourante().filter((c) => jours.has(c)).length : 0,
  );

  $effect(() => {
    // Premier passage côté navigateur : on charge l'état et on bascule sur
    // le jour réel. Avant ça, le composant reste sur son rendu de build.
    if (hydrate) return;
    etat = lire();
    jourAffiche = new Date().getDay();
    blocSelectionne = premierBlocAvecExercice(new Date().getDay());
    hydrate = true;
    mesurerDebutDeSeance(cleDeJourDeSemaine(new Date().getDay()));
  });

  // Filet de sécurité : le journal passe par l'écriture différée, donc une note
  // tapée puis un onglet fermé dans la seconde se perdrait. `pagehide` couvre
  // aussi le retour arrière et le passage en arrière-plan sur iOS.
  $effect(() => {
    if (!hydrate) return;
    const vider = () => ecrire(etat);
    addEventListener("pagehide", vider);
    addEventListener("visibilitychange", vider);
    return () => {
      removeEventListener("pagehide", vider);
      removeEventListener("visibilitychange", vider);
    };
  });

  $effect(() => {
    if (!chronoActif) return;
    const minuteur = setInterval(async () => {
      restant -= 1;
      if (restant > 0) return;
      chronoActif = false;
      restant = 0;
      const { carillon } = await import("~/lib/audio");
      carillon();
      if (blocChronometre > -1) cocher(blocChronometre, true);
    }, 1000);
    return () => clearInterval(minuteur);
  });

  function premierBlocAvecExercice(weekday: number): number {
    const blocs = jourPar(weekday)?.blocks ?? [];
    const i = blocs.findIndex((b) => b.exerciseId);
    return i < 0 ? 0 : i;
  }

  function signaler(persiste: boolean) {
    messageSauvegarde = persiste ? "Enregistré" : "Non enregistré — session en cours uniquement";
    setTimeout(() => (messageSauvegarde = ""), 2200);
  }

  /**
   * Cocher un bloc s'écrit tout de suite ; le journal, lui, passe par le
   * différé — on n'écrit pas à chaque frappe. Un utilisateur qui coche son
   * dernier bloc et ferme l'onglet dans la foulée ne doit pas perdre sa
   * journée : la série est son actif, pas le nôtre.
   */
  function sauver(immediat = false) {
    if (immediat) signaler(ecrire(etat));
    else enregistrer(etat, signaler);
  }

  function cocher(i: number, force = false) {
    if (!hydrate) return;
    const j = journee(etat, cleDuJourAffiche);
    const pos = j.done.indexOf(i);
    if (pos > -1 && !force) j.done.splice(pos, 1);
    else if (pos < 0) {
      j.done.push(i);
      mesurer("block_complete", {
        jour: leJour.label,
        bloc: leJour.blocks[i]?.title,
      });
    }
    etat = { ...etat };
    sauver(true);

    const jours = joursPratiques(etat);
    if (serie(jours) === 3) mesurer("serie_3");

    // Activation réelle : la séance du jour est allée jusqu'au bout, pas
    // seulement « une case a été cochée ».
    if (j.done.length === leJour.blocks.length) {
      mesurer("seance_terminee", { jour: leJour.label, blocs: leJour.blocks.length });
    }

    // Le chiffre de décision de la phase 1. Émis une seule fois par appareil :
    // le palier reste vrai à chaque visite suivante, et un utilisateur fidèle
    // regonflerait sinon le compteur jour après jour.
    for (const palier of paliersDeRetour(jours)) {
      mesurerUneFois(`retour_j${palier}`, { jours: ancienneteEnJours(jours) });
    }
  }

  function demarrerBloc(i: number) {
    const b = leJour.blocks[i];
    if (!b?.minutes) return;
    blocSelectionne = i;
    blocChronometre = i;
    restant = b.minutes * 60;
    chronoActif = true;
  }

  function changerJour(weekday: number) {
    jourAffiche = weekday;
    blocSelectionne = premierBlocAvecExercice(weekday);
    chronoActif = false;
    blocChronometre = -1;
    restant = 0;
  }

  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const jourComplet = (weekday: number) => {
    if (!hydrate) return false;
    const j = etat[cleDeJourDeSemaine(weekday)];
    const blocs = jourPar(weekday)?.blocks.length ?? 0;
    return !!j && blocs > 0 && j.done.length >= Math.ceil(blocs * 0.8);
  };
</script>

<div class="planche">
  <div class="onglets" role="tablist" aria-label="Jour de la semaine">
    {#each JOURS_ORDONNES as j (j)}
      <button
        class="onglet"
        class:complet={jourComplet(j)}
        class:aujourdhui={hydrate && j === new Date().getDay()}
        role="tab"
        aria-selected={j === jourAffiche}
        disabled={!hydrate}
        onclick={() => changerJour(j)}
      >
        {jourPar(j)?.label.slice(0, 3)}
        <span class="point" aria-hidden="true"></span>
      </button>
    {/each}
  </div>

  <div class="bandeau">
    <Metronome />
    <p class="stat">
      Série : <b>{serieEnCours}</b> j · Semaine : <b>{semaine}</b>/7
    </p>
  </div>

  <div class="grille">
    <section aria-label="Séance du jour">
      <div class="titre-seance">
        <h2>{leJour.label}</h2>
        <span class="total">{total} min</span>
      </div>
      <p class="chapo">
        {leJour.focus}
        {#if leJour.keyOfDay}
          <span class="tonalite">Tonalité du jour : {leJour.keyOfDay}.</span>
        {/if}
      </p>

      <div class="barre" role="progressbar" aria-valuenow={Math.round(avancement)} aria-valuemin="0" aria-valuemax="100" aria-label="Avancement de la séance">
        <i style="width:{avancement}%"></i>
      </div>

      <ol class="blocs">
        {#each leJour.blocks as bloc, i (bloc.title)}
          <li
            class="bloc"
            class:selectionne={i === blocSelectionne}
            class:actif={i === blocChronometre && chronoActif}
            class:fait={faits.includes(i)}
          >
            <!-- Tant que l'îlot n'est pas hydraté, les commandes se déclarent
                 indisponibles plutôt que d'avaler le clic en silence. Le
                 contenu, lui, est déjà là : c'est ce que voit un moteur de
                 recherche, et un lecteur sans JavaScript. -->
            <button
              class="case"
              aria-pressed={faits.includes(i)}
              aria-label="Marquer « {bloc.title} » comme fait"
              disabled={!hydrate}
              onclick={() => cocher(i)}
            ></button>

            <div class="corps">
              <span class="etiquette">{bloc.tag}</span>
              <h3>
                <button class="lien-bloc" onclick={() => (blocSelectionne = i)}>
                  {bloc.title}
                </button>
              </h3>
              <ul class="comment">
                {#each bloc.how as consigne (consigne)}
                  <li>{@html consigne}</li>
                {/each}
              </ul>
            </div>

            <div class="meta">
              <span class="duree">{bloc.minutes ? `${bloc.minutes}′` : "libre"}</span>
              {#if bloc.minutes}
                <button
                  class="bouton chrono"
                  title="Chronométrer ce bloc"
                  aria-label="Chronométrer « {bloc.title} »"
                  disabled={!hydrate}
                  onclick={() => demarrerBloc(i)}>▶</button
                >
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>

    <aside>
      <div class="minuteur">
        <p class="petit-titre">Chronomètre du bloc</p>
        <p class="horloge" class:court={chronoActif}>{mmss(restant)}</p>
        <p class="en-cours">
          {#if blocChronometre > -1}
            {leJour.blocks[blocChronometre]?.tag} · {leJour.blocks[blocChronometre]?.title}
          {:else}
            Choisis un bloc pour démarrer
          {/if}
        </p>
        <div class="commandes-minuteur">
          <button
            class="bouton"
            disabled={!hydrate}
            onclick={() => {
              if (chronoActif) chronoActif = false;
              else if (restant > 0) chronoActif = true;
              else demarrerBloc(0);
            }}
          >
            {chronoActif ? "Pause" : "Démarrer"}
          </button>
          <button
            class="bouton"
            disabled={!hydrate}
            onclick={() => {
              chronoActif = false;
              restant = blocChronometre > -1 ? (leJour.blocks[blocChronometre]?.minutes ?? 0) * 60 : 0;
            }}>Remettre à zéro</button
          >
        </div>
      </div>

      {#if exerciceAffiche}
        <Clavier exercice={exerciceAffiche} />
      {:else}
        <div class="panneau">
          <h3>Doigté</h3>
          <p class="chapo" style="margin:0">
            Pas de schéma pour ce bloc. Choisis un bloc de technique, d'harmonie ou d'impro : la
            gamme ou l'accord s'affiche ici avec son doigté.
          </p>
        </div>
      {/if}

      <div class="panneau">
        <h3>Journal du jour</h3>
        <textarea
          placeholder="Tempo atteint, ce qui a coincé, l'idée à garder de l'impro…"
          disabled={!hydrate}
          value={hydrate ? (etat[cleDuJourAffiche]?.note ?? "") : ""}
          oninput={(e) => {
            if (!hydrate) return;
            journee(etat, cleDuJourAffiche).note = e.currentTarget.value;
            sauver();
          }}
        ></textarea>
        <p class="sauvegarde" aria-live="polite">{messageSauvegarde}</p>
      </div>
    </aside>
  </div>
</div>

<style>
  .onglets {
    display: flex;
    overflow-x: auto;
    border-top: 1px solid var(--trait);
    border-bottom: 1px solid var(--trait);
    scrollbar-width: none;
  }
  .onglets::-webkit-scrollbar {
    display: none;
  }
  .onglet {
    flex: 1 0 auto;
    min-width: 64px;
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--poussiere);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 14px 12px 12px;
    cursor: pointer;
    transition: color 0.18s, border-color 0.18s;
  }
  .onglet:hover {
    color: var(--ivoire);
  }
  .onglet[aria-selected="true"] {
    color: var(--laiton);
    border-bottom-color: var(--laiton);
  }
  .onglet.aujourdhui {
    color: var(--ivoire);
  }
  .point {
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: transparent;
    margin: 5px auto 0;
  }
  .onglet.complet .point {
    background: var(--laiton);
  }

  .bandeau {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--trait);
    padding: 12px 0;
  }
  .stat {
    margin: 0 0 0 auto;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--poussiere);
    letter-spacing: 0.1em;
  }
  .stat :global(b) {
    color: var(--laiton);
    font-weight: 600;
  }

  .grille {
    display: grid;
    grid-template-columns: 1fr;
    gap: 34px;
    padding-top: 30px;
  }
  @media (min-width: 900px) {
    .grille {
      grid-template-columns: 1.35fr 0.95fr;
      gap: 44px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 20px;
    }
  }

  .titre-seance {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 4px;
  }
  .total {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--poussiere);
  }
  .tonalite {
    color: var(--laiton);
  }

  .barre {
    height: 2px;
    background: rgba(233, 225, 209, 0.1);
    margin: 14px 0 22px;
    position: relative;
  }
  .barre i {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--laiton);
    transition: width 0.3s;
  }

  .blocs {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .bloc {
    border-top: 1px solid var(--trait);
    padding: 16px 0;
    display: grid;
    grid-template-columns: 26px 1fr auto;
    gap: 14px;
    align-items: start;
  }
  .bloc:last-child {
    border-bottom: 1px solid var(--trait);
  }
  .bloc.selectionne {
    background: linear-gradient(90deg, rgba(201, 162, 39, 0.09), transparent 70%);
  }
  .bloc.actif {
    background: linear-gradient(90deg, rgba(168, 50, 60, 0.12), transparent 70%);
  }
  .bloc.fait .corps {
    opacity: 0.42;
  }

  .case {
    width: 20px;
    height: 20px;
    margin-top: 3px;
    border: 1px solid var(--trait);
    background: transparent;
    cursor: pointer;
    position: relative;
    padding: 0;
    transition: 0.18s;
  }
  .case:hover {
    border-color: var(--laiton);
  }
  .case[aria-pressed="true"] {
    background: var(--laiton);
    border-color: var(--laiton);
  }
  .case[aria-pressed="true"]::after {
    content: "";
    position: absolute;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid var(--ebene);
    border-width: 0 2px 2px 0;
    transform: rotate(43deg);
  }

  .lien-bloc {
    background: none;
    border: 0;
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .lien-bloc:hover {
    color: var(--laiton);
  }

  .comment {
    margin: 0;
    padding-left: 16px;
    color: var(--poussiere);
    font-size: 13.5px;
  }
  .comment li {
    margin-bottom: 3px;
  }

  .meta {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .duree {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--poussiere);
    white-space: nowrap;
  }
  .chrono {
    width: 30px;
    height: 30px;
    padding: 0;
    font-size: 11px;
  }
  .bloc.actif .chrono {
    background: var(--feutre);
    border-color: var(--feutre);
    color: #fff;
  }

  .minuteur {
    border: 1px solid var(--trait);
    background: var(--caisse);
    padding: 20px;
    text-align: center;
    margin-bottom: 26px;
  }
  .petit-titre {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--poussiere);
    margin: 0;
  }
  .horloge {
    font-family: var(--mono);
    font-size: clamp(46px, 11vw, 62px);
    line-height: 1;
    color: var(--ivoire);
    margin: 8px 0 4px;
    font-variant-numeric: tabular-nums;
  }
  .horloge.court {
    color: var(--laiton);
  }
  .en-cours {
    font-size: 14px;
    color: var(--poussiere);
    min-height: 20px;
    margin: 0 0 14px;
  }
  .commandes-minuteur {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  textarea {
    width: 100%;
    min-height: 92px;
    background: var(--caisse2);
    border: 1px solid var(--trait);
    color: var(--ivoire);
    font-family: var(--texte);
    font-size: 13.5px;
    padding: 10px;
    resize: vertical;
  }
  .sauvegarde {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--laiton);
    letter-spacing: 0.14em;
    height: 14px;
    margin: 6px 0 0;
  }
</style>
