<script lang="ts">
  import {
    AMBIANCES,
    TONALITES_IMPRO,
    ambiance as ambiancePar,
    nomDAccord,
    notesDAccord,
  } from "~/content/curriculum/grilles";
  import type { PitchClass } from "~/content/curriculum/types";
  import { claverSVG, construireSurlignage } from "~/lib/clavier";
  import { mesurer } from "~/lib/mesure";
  import { nomDeTonique } from "~/lib/musique";

  interface Props {
    ambianceInitiale?: string;
    toniqueInitiale?: PitchClass;
    /** Sur les pages dédiées, le choix est figé : la page EST la grille. */
    figee?: boolean;
  }

  let { ambianceInitiale = "melancolique", toniqueInitiale = 9, figee = false }: Props = $props();

  let idAmbiance = $state(ambianceInitiale);
  let tonique = $state<PitchClass>(toniqueInitiale);
  let enLecture = $state(false);
  let accordCourant = $state(-1);

  const amb = $derived(ambiancePar(idAmbiance) ?? AMBIANCES[0]!);

  const svg = $derived.by(() => {
    // Les notes sûres, affichées comme un schéma de référence : pas de doigté
    // ici, c'est un terrain de jeu, pas un exercice.
    const { surlignage, base } = construireSurlignage(
      {
        id: "impro",
        name: amb.nomGammeSure,
        tip: "",
        ghost: amb.gammeSure,
        root: tonique,
        keys: [tonique],
        tempo: 0,
      },
      { main: "MD", tonique },
    );
    return claverSVG(surlignage, base);
  });

  $effect(() => {
    if (!enLecture) return;
    let minuteur: ReturnType<typeof setInterval> | undefined;
    let annule = false;

    void (async () => {
      const { ac, accord, note } = await import("~/lib/audio");
      if (annule) return;

      const dureeMesure = (60 / amb.tempo) * 4;
      let prochain = ac().currentTime + 0.1;
      let index = 0;
      const enAttente: Array<{ quand: number; i: number }> = [];

      const scruter = () => {
        const c = ac();
        while (prochain < c.currentTime + 0.3) {
          const i = index % amb.grille.length;
          const a = amb.grille[i]!;
          // Accord une octave sous le Do central, basse encore une octave dessous :
          // c'est la place de la main gauche.
          accord(
            notesDAccord(a).map((n) => n + tonique - 12),
            { debut: prochain, duree: dureeMesure * 0.92, volume: 0.13 },
          );
          note(a.fondamentale + tonique - 24, {
            debut: prochain,
            duree: dureeMesure * 0.92,
            volume: 0.1,
          });
          enAttente.push({ quand: prochain, i });
          prochain += dureeMesure;
          index++;
        }
        while (enAttente.length && enAttente[0]!.quand <= c.currentTime) {
          accordCourant = enAttente.shift()!.i;
        }
      };

      scruter();
      minuteur = setInterval(scruter, 25);
    })();

    return () => {
      annule = true;
      clearInterval(minuteur);
      accordCourant = -1;
    };
  });

  /**
   * L'action la plus importante de la page d'accueil : c'est ici que quelqu'un
   * entend le produit pour la première fois. Le rapport `impro_ecoute` sur
   * visiteurs répond en trois jours à « le hook est-il lisible ? », bien avant
   * que la rétention ne dise quoi que ce soit.
   */
  function basculerEcoute() {
    enLecture = !enLecture;
    if (enLecture) mesurer("impro_ecoute", { ambiance: idAmbiance, tonalite: tonique });
  }

  function changer(quoi: "ambiance" | "tonalite", valeur: string) {
    if (quoi === "ambiance") idAmbiance = valeur;
    else tonique = Number(valeur) as PitchClass;
    mesurer("impro_generate", { ambiance: idAmbiance, tonalite: tonique });
  }
</script>

<div class="generateur">
  {#if !figee}
    <div class="choix">
      <fieldset>
        <legend>Ambiance</legend>
        <div class="pastilles">
          {#each AMBIANCES as a (a.id)}
            <button
              class="bouton"
              class:actif={a.id === idAmbiance}
              aria-pressed={a.id === idAmbiance}
              onclick={() => changer("ambiance", a.id)}>{a.nom}</button
            >
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend>Tonalité</legend>
        <div class="pastilles">
          {#each TONALITES_IMPRO as t (t)}
            <button
              class="bouton"
              class:actif={t === tonique}
              aria-pressed={t === tonique}
              onclick={() => changer("tonalite", String(t))}>{nomDeTonique(t)}</button
            >
          {/each}
        </div>
      </fieldset>
    </div>
  {/if}

  {#if !figee}
    <p class="couleur">{amb.couleur}</p>
  {/if}

  <div class="grille-accords" aria-label="Grille d'accords">
    {#each amb.grille as a, i (i)}
      <div class="accord" class:sonne={i === accordCourant}>
        <span class="degre">{a.degre}</span>
        <span class="nom">{nomDAccord(a, tonique)}</span>
      </div>
    {/each}
  </div>

  <div class="lecture">
    <button class="bouton principal" onclick={basculerEcoute}>
      {enLecture ? "❚❚ Arrêter" : "▶ Jouer la grille"}
    </button>
    <span class="tempo">{amb.tempo} BPM</span>
  </div>

  <!-- Sur une page dédiée, la grille est déjà détaillée en HTML plus bas :
       l'îlot n'y sert qu'à écouter. Répéter le clavier et la contrainte ferait
       du contenu dupliqué sur la même page, ce que ni un lecteur ni un moteur
       de recherche n'apprécient. -->
  {#if !figee}
    <div class="notes-sures">
      <p class="petit-titre">
        Les notes qui ne peuvent pas sonner faux — {amb.nomGammeSure} de {nomDeTonique(tonique)}
      </p>
      <div class="clavier">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG construit par nos soins -->
        {@html svg}
      </div>
    </div>

    <div class="consigne">
      <p class="petit-titre">La contrainte</p>
      <p class="regle">{amb.contrainte}</p>
      <p class="conseil">{@html amb.conseil}</p>
    </div>
  {/if}
</div>

<style>
  .generateur {
    border: 1px solid var(--trait);
    background: var(--caisse);
    padding: 22px;
  }
  .choix {
    display: flex;
    gap: 26px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }
  legend {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--poussiere);
    padding: 0 0 8px;
  }
  .pastilles {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .pastilles .bouton {
    font-size: 10px;
    padding: 7px 11px;
  }
  .couleur {
    color: var(--poussiere);
    font-size: 13.5px;
    margin: 0 0 18px;
    max-width: 60ch;
  }

  .grille-accords {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .accord {
    border: 1px solid var(--trait);
    background: var(--caisse2);
    padding: 14px 8px;
    text-align: center;
    transition: 0.12s;
  }
  .accord.sonne {
    background: var(--feutre);
    border-color: var(--feutre);
  }
  .degre {
    display: block;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    color: var(--poussiere-vive);
  }
  .accord.sonne .degre {
    color: rgba(255, 255, 255, 0.8);
  }
  .nom {
    display: block;
    font-family: var(--titre);
    font-size: 26px;
    line-height: 1.2;
    margin-top: 4px;
  }

  .lecture {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 22px;
  }
  .tempo {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--poussiere);
    letter-spacing: 0.14em;
  }

  .petit-titre {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--poussiere);
    margin: 0 0 10px;
  }
  .notes-sures {
    margin-bottom: 22px;
  }
  .clavier :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .consigne {
    border-top: 1px solid var(--trait);
    padding-top: 18px;
  }
  .regle {
    font-size: 17px;
    margin: 0 0 10px;
    color: var(--ivoire);
  }
  .conseil {
    font-size: 13.5px;
    color: var(--poussiere);
    margin: 0;
    max-width: 62ch;
  }

  @media (max-width: 560px) {
    .grille-accords {
      grid-template-columns: repeat(2, 1fr);
    }
    .nom {
      font-size: 22px;
    }
  }
</style>
