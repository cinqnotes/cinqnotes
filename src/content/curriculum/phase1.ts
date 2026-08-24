/**
 * Phase pédagogique 1 — Fondations, mois 1 à 3.
 * Cinq séances de 45 min, une séance longue, un jour léger.
 * Le bloc « Impro » n'est jamais optionnel.
 */
import type { Phase } from "~/content/curriculum/types";

export const PHASE_1: Phase = {
  id: 1,
  label: "Fondations",
  months: [1, 3],
  exitCriteria: [
    "Poser n'importe quelle triade majeure ou mineure, en position fondamentale ou en renversement, en moins de 2 secondes et sans réfléchir.",
    "Tenir 2 minutes d'improvisation sans s'arrêter.",
    "Jouer la gamme de Do et de Sol mains ensemble à 80 bpm, régulièrement.",
    "Avoir relevé au moins une mélodie entière à l'oreille.",
  ],
  days: [
    {
      weekday: 1,
      label: "Lundi",
      focus: "Fondations — les triades majeures entrent dans les doigts.",
      keyOfDay: "Do majeur",
      blocks: [
        {
          tag: "Technique",
          title: "Gamme de Do, mains séparées puis ensemble",
          minutes: 5,
          exerciseId: "gamme-majeure",
          how: [
            "2 octaves, métronome à 60, croches régulières.",
            "MD seule → MG seule → ensemble. Si ça casse, tu ralentis, tu n'accélères jamais pour « rattraper ».",
            "Doigté : pouce sous le 3 sur Fa (MD), 3 par-dessus sur Sol (MG).",
          ],
        },
        {
          tag: "Harmonie",
          title: "Triades majeures + les 3 renversements",
          minutes: 10,
          exerciseId: "triade-majeure",
          how: [
            "Do, Sol, Ré, La, Mi — dans cet ordre (cycle des quintes).",
            "Pour chaque : position fondamentale → 1<sup>er</sup> renversement → 2<sup>e</sup> → octave. Puis redescends.",
            "Objectif du mois : poser l'accord annoncé en moins de 2 secondes.",
          ],
        },
        {
          tag: "Oreille",
          title: "Degrés de la gamme (Functional Ear Trainer)",
          minutes: 10,
          how: [
            "Mode « degrés », tonalité Do majeur, degrés 1-3-5 seulement au début.",
            "<b>Chante</b> chaque réponse avant de la valider, même faux. C'est là qu'est le progrès.",
            "Élargis à 1-2-3-4-5 seulement quand tu es à 90 % de réussite.",
          ],
        },
        {
          tag: "Impro",
          title: "Pédale de quinte + pentatonique de La mineure",
          minutes: 15,
          exerciseId: "pentatonique-mineure",
          how: [
            "MG : tiens Do–Sol (une quinte), rejoue-la toutes les 2 mesures.",
            "MD : uniquement La-Do-Ré-Mi-Sol. Impossible de faire une fausse note.",
            "Contrainte : <b>3 notes maximum par phrase</b>, puis un silence aussi long que la phrase.",
          ],
        },
        {
          tag: "Capture",
          title: "Enregistrer et noter",
          minutes: 5,
          how: [
            "Enregistre 1 minute d'impro au téléphone, sans réécouter tout de suite.",
            "Note dans le journal : tempo atteint, ce qui a coincé, l'idée à garder.",
          ],
        },
      ],
    },
    {
      weekday: 2,
      label: "Mardi",
      focus: "Accords mineurs — ton point faible actuel, donc la priorité.",
      keyOfDay: "Sol majeur",
      blocks: [
        {
          tag: "Technique",
          title: "Arpèges de triades, 2 octaves",
          minutes: 5,
          exerciseId: "arpege-majeur",
          how: [
            "Do, Lam, Fa, Sol — montée et descente, mains séparées.",
            "Poignet souple, pas de crispation. Métronome à 60.",
          ],
        },
        {
          tag: "Harmonie",
          title: "Les 12 triades mineures + renversements",
          minutes: 10,
          exerciseId: "triade-mineure",
          how: [
            "Lam, Mim, Rém d'abord (touches blanches), puis Sim, Fa♯m.",
            "Repère mental : une triade mineure = la majeure avec la note du milieu descendue d'un demi-ton.",
            "Alterne Do / Dom, Sol / Solm pour entendre la bascule.",
          ],
        },
        {
          tag: "Oreille",
          title: "Majeur ou mineur ?",
          minutes: 10,
          how: [
            "Joue un accord au hasard, les yeux fermés, devine avant de regarder.",
            "Puis passe à l'app : mode reconnaissance de qualité d'accord.",
            "Cherche la sensation, pas le calcul : mineur = plus sombre, plus fermé.",
          ],
        },
        {
          tag: "Impro",
          title: "Un seul accord, question / réponse",
          minutes: 15,
          exerciseId: "gamme-mineure-naturelle",
          how: [
            "MG : Lam en boucle, rythme simple et régulier.",
            "MD : phrase de 2 mesures (la <b>question</b>), puis 2 mesures qui y répondent en finissant sur La.",
            "La réponse reprend le même rythme, change juste les notes de la fin.",
          ],
        },
        {
          tag: "Capture",
          title: "Enregistrer et noter",
          minutes: 5,
          how: ["1 minute d'impro enregistrée. Une phrase dans le journal."],
        },
      ],
    },
    {
      weekday: 3,
      label: "Mercredi",
      focus: "Rythme et indépendance des mains — le vrai goulot d'étranglement.",
      keyOfDay: "Ré majeur",
      blocks: [
        {
          tag: "Technique",
          title: "Gamme mains ensemble, tempo lent",
          minutes: 5,
          exerciseId: "gamme-majeure",
          how: [
            "Do puis Sol, 2 octaves, à 50 bpm. Oui, 50.",
            "Si les mains se décalent, tu descends encore le tempo.",
          ],
        },
        {
          tag: "Harmonie",
          title: "I–V–vi–IV avec liaison des voix",
          minutes: 10,
          exerciseId: "grille-I-V-vi-IV",
          how: [
            "En Do : Do → Sol → Lam → Fa.",
            "Joue-les <b>en renversements</b> pour que les doigts bougent le moins possible entre deux accords.",
            "C'est la grille de 80 % de la pop. Elle doit devenir un réflexe.",
          ],
        },
        {
          tag: "Rythme",
          title: "Dissocier les deux mains",
          minutes: 10,
          exerciseId: "basse-accord-accord",
          how: [
            "MG : basse–accord–accord (valse) ou basse sur 1 et 3.",
            "MD : joue uniquement sur les contretemps (le « et » entre deux clics).",
            "Métronome réglé pour cliquer sur <b>2 et 4</b> seulement. Inconfortable au début, décisif ensuite.",
          ],
        },
        {
          tag: "Impro",
          title: "Improviser sur la grille",
          minutes: 15,
          exerciseId: "grille-I-V-vi-IV",
          how: [
            "Backing track I–V–vi–IV, ou MG qui tient la grille.",
            "Vise les notes de l'accord en cours sur les temps forts, le reste peut passer partout.",
            "Une idée par tour de grille, pas dix.",
          ],
        },
        {
          tag: "Capture",
          title: "Enregistrer et noter",
          minutes: 5,
          how: ["1 minute enregistrée. Note le tempo tenu proprement."],
        },
      ],
    },
    {
      weekday: 4,
      label: "Jeudi",
      focus: "Oreille et répertoire — apprendre un morceau sans partition.",
      keyOfDay: "La majeur",
      blocks: [
        {
          tag: "Technique",
          title: "Échauffement libre",
          minutes: 5,
          exerciseId: "gamme-majeure",
          how: ["Gamme du jour + arpèges, à ton tempo de confort."],
        },
        {
          tag: "Répertoire",
          title: "Un morceau simple, 4 mesures à la fois",
          minutes: 15,
          how: [
            "Choisis court et sous ton niveau. Suggestions : <i>Für Elise</i> (thème), <i>Gymnopédie n°1</i>, <i>Comptine d'un autre été</i> (partie A).",
            "4 mesures, mains séparées, jusqu'à 3 passages parfaits d'affilée. Puis ensemble. Puis les 4 suivantes.",
            "Ne joue jamais le morceau en entier « pour voir » : c'est là qu'on installe les erreurs.",
          ],
        },
        {
          tag: "Oreille",
          title: "Relever une mélodie à l'oreille",
          minutes: 15,
          how: [
            "Une comptine ou un thème que tu connais par cœur (Frère Jacques, Joe Dassin, un générique…).",
            "Trouve la première note en tâtonnant, puis chante la suite <b>une note à la fois</b> avant de la chercher.",
            "Lent et juste vaut mieux que rapide et approximatif. C'est la compétence qui débloque tout le reste.",
          ],
        },
        {
          tag: "Impro",
          title: "Improviser dans le style du morceau",
          minutes: 10,
          exerciseId: "pentatonique-mineure",
          how: [
            "Reprends l'ambiance de ce que tu viens de travailler : même tempo, même main gauche, tes notes.",
            "C'est le pont entre interpréter et créer.",
          ],
        },
      ],
    },
    {
      weekday: 5,
      label: "Vendredi",
      focus: "Consolidation et impro longue — la séance plaisir.",
      keyOfDay: "Mi majeur",
      blocks: [
        {
          tag: "Technique",
          title: "Échauffement",
          minutes: 5,
          exerciseId: "gamme-majeure",
          how: ["Gammes de la semaine enchaînées, sans t'arrêter aux fautes."],
        },
        {
          tag: "Harmonie",
          title: "Test flash",
          minutes: 10,
          exerciseId: "triade-majeure",
          how: [
            "Écris 12 accords sur des papiers, tire au sort, pose l'accord en moins de 2 secondes.",
            "Note ton score. Les 3 accords les plus lents deviennent la priorité de lundi.",
          ],
        },
        {
          tag: "Oreille",
          title: "Session courte",
          minutes: 5,
          how: ["Functional Ear Trainer, 5 minutes, sans forcer."],
        },
        {
          tag: "Impro",
          title: "Vingt minutes sans consigne",
          minutes: 20,
          exerciseId: "pentatonique-mineure",
          how: [
            "Aucune contrainte, aucun objectif, aucune correction. Yeux fermés si ça aide.",
            "Enregistre <b>l'intégralité</b> des 20 minutes.",
            "Le lendemain, tu réécoutes et tu gardes les 8 mesures qui valent le coup : c'est ta matière première de compo.",
          ],
        },
      ],
    },
    {
      weekday: 6,
      label: "Samedi",
      focus: "Séance longue — transcription et composition.",
      blocks: [
        {
          tag: "Échauffement",
          title: "Technique + révision des accords",
          minutes: 10,
          exerciseId: "arpege-majeur",
          how: ["Gammes, arpèges, les 3 accords lents identifiés vendredi."],
        },
        {
          tag: "Transcription",
          title: "Relever un morceau que tu aimes",
          minutes: 25,
          how: [
            "Mélodie d'abord, accords ensuite. Un morceau par mois, pas par semaine.",
            "Méthode : trouve la tonique en chantant, puis la basse, puis la qualité des accords (majeur/mineur).",
            "C'est le moyen le plus efficace d'acquérir du vocabulaire mélodique — plus que n'importe quel exercice.",
          ],
        },
        {
          tag: "Composition",
          title: "Huit mesures, finies",
          minutes: 30,
          exerciseId: "grille-I-V-vi-IV",
          how: [
            "Pars d'une idée capturée cette semaine, ou d'une grille empruntée (les suites d'accords ne sont pas protégées).",
            "Structure minimale : 4 mesures A, 4 mesures A' qui finissent différemment.",
            "Note-les dans MuseScore. <b>8 mesures terminées</b> valent mieux que 32 mesures géniales inachevées.",
          ],
        },
        {
          tag: "Jeu libre",
          title: "Jouer pour le plaisir",
          minutes: 10,
          how: ["Ton morceau préféré, mal, fort, sans métronome. Non négociable."],
        },
      ],
    },
    {
      weekday: 0,
      label: "Dimanche",
      focus: "Journée légère — écoute active et revue de semaine.",
      blocks: [
        {
          tag: "Écoute",
          title: "Écoute active (loin du piano)",
          minutes: 15,
          how: [
            "En marchant, en voiture, peu importe. Une chanson à la fois.",
            "Trouve la tonique en la fredonnant, suis la ligne de basse, compte la structure (couplet / refrain / pont).",
            "Note : combien d'accords ? Est-ce que le refrain monte ou descend ?",
          ],
        },
        {
          tag: "Revue",
          title: "Réécouter la semaine",
          minutes: 5,
          how: [
            "Réécoute tes enregistrements. Garde une idée, une seule.",
            "Relis tes notes : où as-tu progressé ? Qu'est-ce qui bloque encore ?",
          ],
        },
        {
          tag: "Optionnel",
          title: "Piano sans objectif",
          minutes: 0,
          how: ["Si l'envie est là. Sinon, le repos fait partie de la méthode."],
        },
      ],
    },
  ],
};

/** Ordre d'affichage : la semaine commence le lundi, dimanche ferme. */
export const JOURS_ORDONNES = [1, 2, 3, 4, 5, 6, 0] as const;

export const jour = (weekday: number) =>
  PHASE_1.days.find((j) => j.weekday === weekday);

export const dureeDuJour = (weekday: number): number =>
  jour(weekday)?.blocks.reduce((s, b) => s + b.minutes, 0) ?? 0;

/** Slug d'URL d'un jour : « Lundi » → « lundi ». */
export const slugDeJour = (weekday: number): string =>
  (jour(weekday)?.label ?? "").toLowerCase();
