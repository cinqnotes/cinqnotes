<script lang="ts">
  import type { Exercise, Hand, PitchClass } from "~/content/curriculum/types";
  import { claverSVG, construireSurlignage } from "~/lib/clavier";
  import { nomDeTonique, pasDExercice } from "~/lib/musique";
  import { mesurer } from "~/lib/mesure";

  interface Props {
    exercice: Exercise;
    /** SVG rendu au build : sert de contenu initial avant hydratation (I2). */
    svgInitial?: string;
  }

  let { exercice }: Props = $props();

  // La tonalité choisie survit au changement d'exercice quand elle reste
  // proposée ; sinon on retombe sur la tonique par défaut de l'exercice.
  let toniqueChoisie = $state<PitchClass | null>(null);
  let mainChoisie = $state<Hand>("MD");
  let indexPas = $state(0);
  let enLecture = $state(false);
  let son = $state(false);
  let vitesse = $state(100);

  const tonique = $derived(
    toniqueChoisie !== null && exercice.keys.includes(toniqueChoisie)
      ? toniqueChoisie
      : exercice.root,
  );

  // Un exercice peut n'avoir de doigté que pour une main (la basse main gauche,
  // la pentatonique main droite) : on bascule plutôt que d'afficher un vide.
  const main = $derived(
    pasDExercice(exercice, mainChoisie, tonique) ? mainChoisie : mainChoisie === "MD" ? "MG" : "MD",
  );

  const pas = $derived(pasDExercice(exercice, main, tonique));
  const deuxMains = $derived(
    pasDExercice(exercice, "MD", tonique) !== null && pasDExercice(exercice, "MG", tonique) !== null,
  );

  const svg = $derived.by(() => {
    const { surlignage, base } = construireSurlignage(exercice, { main, tonique, indexPas });
    return claverSVG(surlignage, base);
  });

  // Changer d'exercice remet l'animation à son début.
  $effect(() => {
    exercice.id;
    indexPas = 0;
    enLecture = false;
  });

  $effect(() => {
    if (!enLecture || !pas) return;
    let annule = false;

    const jouer = async () => {
      const { note } = await import("~/lib/audio");
      if (annule || !son) return;
      const courant = pas[indexPas % pas.length];
      for (const n of courant.n) note(n + tonique);
    };

    void jouer();
    const minuteur = setInterval(() => {
      indexPas += 1;
      void jouer();
    }, exercice.tempo / (vitesse / 100));

    return () => {
      annule = true;
      clearInterval(minuteur);
    };
  });

  function basculerLecture() {
    enLecture = !enLecture;
    if (enLecture) mesurer("exercise_play", { exercice: exercice.id, tonalite: tonique });
  }

  function changerTonalite(e: Event) {
    toniqueChoisie = Number((e.target as HTMLSelectElement).value) as PitchClass;
    indexPas = 0;
    mesurer("key_change", { exercice: exercice.id, tonalite: toniqueChoisie });
  }
</script>

<div class="clavier-panneau">
  <p class="nom">{exercice.name} — {nomDeTonique(tonique)}</p>

  <div class="clavier">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG construit par nos soins, aucune donnée externe -->
    {@html svg}
  </div>

  <div class="commandes">
    <button class="bouton" class:actif={enLecture} onclick={basculerLecture} disabled={!pas}>
      {enLecture ? "❚❚ Pause" : "▶ Lire"}
    </button>

    <button
      class="bouton"
      onclick={() => {
        mainChoisie = main === "MD" ? "MG" : "MD";
        indexPas = 0;
      }}
      disabled={!deuxMains}
    >
      {main === "MD" ? "Main droite" : "Main gauche"}
    </button>

    <select aria-label="Tonalité de l'exercice" value={tonique} onchange={changerTonalite}>
      {#each exercice.keys as k (k)}
        <option value={k}>{nomDeTonique(k)}</option>
      {/each}
    </select>

    <button class="bouton" class:actif={son} aria-pressed={son} onclick={() => (son = !son)}>
      Son
    </button>

    <input
      type="range"
      min="40"
      max="170"
      bind:value={vitesse}
      aria-label="Vitesse de l'animation"
    />
  </div>

  <p class="conseil">{@html exercice.tip}</p>

  <p class="legende">
    <span><b>1</b> pouce</span><span><b>2</b> index</span><span><b>3</b> majeur</span><span
      ><b>4</b> annulaire</span
    ><span><b>5</b> auriculaire</span>
  </p>
</div>

<style>
  .clavier-panneau {
    border: 1px solid var(--trait);
    background: var(--caisse);
    padding: 18px;
    margin-bottom: 26px;
  }
  .nom {
    font-family: var(--titre);
    font-size: 20px;
    margin: 0 0 14px;
  }
  .clavier :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }
  .commandes {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  .commandes .bouton {
    font-size: 10px;
    padding: 7px 11px;
  }
  select {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: var(--caisse2);
    border: 1px solid var(--trait);
    color: var(--laiton);
    padding: 7px 9px;
    cursor: pointer;
  }
  select:hover {
    border-color: var(--laiton);
  }
  input[type="range"] {
    accent-color: var(--laiton);
    width: 78px;
    margin-left: auto;
  }
  .conseil {
    font-size: 12.5px;
    color: var(--poussiere);
    margin: 12px 0 0;
  }
  .legende {
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: var(--poussiere);
    margin-top: 10px;
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
  }
  .legende :global(b) {
    color: var(--laiton);
    font-weight: 600;
  }
</style>
