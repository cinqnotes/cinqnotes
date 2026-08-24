<script lang="ts">
  import { creerMetronome, type Metronome } from "~/lib/metronome";

  let bpm = $state(60);
  let actif = $state(false);
  let pulsation = $state<{ temps: number; accentue: boolean } | null>(null);
  let metronome: Metronome | null = null;

  // Le métronome est instancié à la première utilisation : créer un
  // AudioContext avant tout geste utilisateur le laisserait suspendu.
  function basculer() {
    metronome ??= creerMetronome({
      bpm,
      surTemps: (temps, accentue) => {
        pulsation = { temps, accentue };
        setTimeout(() => (pulsation = null), 90);
      },
    });
    if (actif) {
      metronome.arreter();
      actif = false;
    } else {
      metronome.reglerTempo(bpm);
      metronome.demarrer();
      actif = true;
    }
  }

  // Changer le tempo en cours de route ne coupe pas le clic.
  $effect(() => {
    metronome?.reglerTempo(bpm);
  });
</script>

<div class="metronome">
  <button class="bouton" class:actif aria-pressed={actif} onclick={basculer}>Métronome</button>

  <span
    class="pulsation"
    class:frappe={pulsation !== null}
    class:un={pulsation?.accentue}
    aria-hidden="true"
  ></span>

  <input type="range" min="40" max="140" step="2" bind:value={bpm} aria-label="Tempo" />
  <span class="bpm">{bpm} <span>BPM</span></span>
</div>

<style>
  .metronome {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bouton {
    font-size: 11px;
    padding: 7px 14px;
  }
  .pulsation {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: rgba(201, 162, 39, 0.18);
    flex: 0 0 auto;
    transition: 0.06s;
  }
  .pulsation.frappe {
    background: var(--laiton);
  }
  .pulsation.frappe.un {
    background: var(--feutre);
    transform: scale(1.5);
  }
  input[type="range"] {
    accent-color: var(--laiton);
    width: 130px;
  }
  .bpm {
    font-family: var(--mono);
    font-size: 20px;
    color: var(--laiton);
    min-width: 52px;
    text-align: right;
  }
  .bpm span {
    font-size: 10px;
    color: var(--poussiere);
    letter-spacing: 0.14em;
  }
</style>
