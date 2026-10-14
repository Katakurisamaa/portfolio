/**
 * Verbum — Mémorisation & Maîtrise des Écritures
 * Développé par Benjamin Minko
 * Vanilla JavaScript ES6+
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Base de données biblique (Corpus riche de versets fondamentaux)
  // ==========================================================================
  const BIBLE_VERSES = [
    {
      id: "ps-91-1",
      book: "Psaumes",
      chapter: 91,
      verse: 1,
      ref: "Psaumes 91:1",
      theme: "Paix & Protection",
      text_lsg: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.",
      text_pdv: "Celui qui s'abrite auprès du Dieu très-haut se repose à l'ombre du Tout-Puissant.",
      clues: [
        "Ancien Testament, recueil poétique et hymnique de louange et de prière.",
        "Le psaume par excellence invoqué pour la protection divine et le refuge spirituel.",
        "Chapitre 91, tout premier verset de ce célèbre cantique de confiance."
      ],
      context: "Ce psaume célèbre la sécurité inaltérable de celui qui choisit l'Éternel comme demeure et rempart."
    },
    {
      id: "ps-23-1",
      book: "Psaumes",
      chapter: 23,
      verse: 1,
      ref: "Psaumes 23:1",
      theme: "Paix & Protection",
      text_lsg: "L'Éternel est mon berger: je ne manquerai de rien.",
      text_pdv: "Le Seigneur est mon berger, je ne manque de rien.",
      clues: [
        "Ancien Testament, attribué au roi David dans sa jeunesse pastorale.",
        "L'image poétique la plus universellement connue d'un troupeau conduit par son guide bienveillant.",
        "Chapitre 23, tout premier verset."
      ],
      context: "David s'appuie sur son passé de berger pour exprimer la sollicitude et la fidélité infaillible de Dieu."
    },
    {
      id: "ps-119-105",
      book: "Psaumes",
      chapter: 119,
      verse: 105,
      ref: "Psaumes 119:105",
      theme: "Sagesse & Vérité",
      text_lsg: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
      text_pdv: "Ta parole est une lampe qui guide mes pas, une lumière sur mon chemin.",
      clues: [
        "Ancien Testament, le plus long de tous les chapitres de la Bible.",
        "Un poème acrostiche dédié tout entier à la beauté de la loi et de la révélation divine.",
        "Section 'Noun' du Psaume 119, verset 105."
      ],
      context: "La Parole divine éclaire à la fois le pas immédiat (la lampe) et la direction générale de l'existence (la lumière)."
    },
    {
      id: "ps-46-1",
      book: "Psaumes",
      chapter: 46,
      verse: 1,
      ref: "Psaumes 46:1",
      theme: "Victoire & Force",
      text_lsg: "Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.",
      text_pdv: "Dieu est pour nous un refuge et un soutien, une aide toujours présente dans les difficultés.",
      clues: [
        "Ancien Testament, cantique composé pour les fils de Koré.",
        "A inspiré le fameux hymne de la Réforme 'C'est un rempart que notre Dieu'.",
        "Psaume 46, verset d'introduction."
      ],
      context: "Une affirmation inébranlable que même si la terre tremblait, l'abri divin demeure souverain."
    },
    {
      id: "ps-121-1-2",
      book: "Psaumes",
      chapter: 121,
      verse: 1,
      ref: "Psaumes 121:1-2",
      theme: "Paix & Protection",
      text_lsg: "Je lève mes yeux vers les montagnes: d'où me viendra le secours? Le secours me vient de l'Éternel, qui a fait les cieux et la terre.",
      text_pdv: "Je lève les yeux vers les collines: d'où me viendra le secours? Le secours me vient du Seigneur, qui a fait le ciel et la terre.",
      clues: [
        "Ancien Testament, fait partie des 'Cantiques des montées' chantés par les pèlerins montant à Jérusalem.",
        "Question existentielle sur l'origine du secours véritable face aux dangers du voyage.",
        "Psaume 121, versets 1 et 2."
      ],
      context: "Le croyant ne place pas son espoir dans les collines fortifiées ou païennes, mais dans le Créateur souverain."
    },
    {
      id: "pr-3-5-6",
      book: "Proverbes",
      chapter: 3,
      verse: 5,
      ref: "Proverbes 3:5-6",
      theme: "Foi & Confiance",
      text_lsg: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.",
      text_pdv: "Mets ta confiance dans le Seigneur de tout ton cœur, ne t'appuie pas sur ta propre intelligence. Dans tout ce que tu fais, reconnais-le, et il guidera tes pas.",
      clues: [
        "Ancien Testament, livre sapienzial attribué au roi Salomon.",
        "Enseignement adressé à un fils sur les limites de la seule raison humaine face à la providence.",
        "Chapitre 3 des Proverbes, versets 5 et 6."
      ],
      context: "L'abandon à la sagesse divine préserve de l'arrogance intellectuelle et ouvre la voie droite."
    },
    {
      id: "pr-4-23",
      book: "Proverbes",
      chapter: 4,
      verse: 23,
      ref: "Proverbes 4:23",
      theme: "Sagesse & Vérité",
      text_lsg: "Garde ton cœur plus que toute autre chose, car de lui jaillissent les sources de la vie.",
      text_pdv: "Veille sur ton cœur plus que sur toute autre chose, car c'est de lui que dépend toute ta vie.",
      clues: [
        "Ancien Testament, recueil de sentences morales et spirituelles.",
        "L'organe central de la pensée, des affections et de la volonté doit être gardé comme une forteresse.",
        "Proverbes 4, verset 23."
      ],
      context: "Dans la pensée hébraïque, le cœur est le centre décisionnel de l'être intérieur d'où émanent toutes les orientations vitales."
    },
    {
      id: "pr-18-10",
      book: "Proverbes",
      chapter: 18,
      verse: 10,
      ref: "Proverbes 18:10",
      theme: "Paix & Protection",
      text_lsg: "Le nom de l'Éternel est une tour forte; le juste s'y réfugie, et se trouve en sûreté.",
      text_pdv: "Le nom du Seigneur est une forteresse solide: le juste y court et il est protégé.",
      clues: [
        "Ancien Testament, livre de Salomon.",
        "Une métaphore militaire antique décrivant le Nom divin comme un donjon imprenable.",
        "Proverbes chapitre 18, verset 10."
      ],
      context: "Le 'Nom' représente le caractère, l'autorité et la fidélité éprouvée du Dieu vivant."
    },
    {
      id: "es-40-31",
      book: "Ésaïe",
      chapter: 40,
      verse: 31,
      ref: "Ésaïe 40:31",
      theme: "Victoire & Force",
      text_lsg: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point; ils marchent, et ne se fatiguent point.",
      text_pdv: "Mais ceux qui mettent leur espoir dans le Seigneur reçoivent des forces nouvelles. Ils s'élèvent comme sur des ailes d'aigle, ils courent sans se fatiguer, ils marchent sans perdre courage.",
      clues: [
        "Ancien Testament, grand prophète messianique d'Israël.",
        "Message de consolation adressé au peuple épuisé en exil avec l'image majestueuse de l'aigle en plein essor.",
        "Chapitre 40, verset final 31."
      ],
      context: "L'attente active du Seigneur transcende la lassitude naturelle par une vigueur surnaturelle renouvelée."
    },
    {
      id: "es-41-10",
      book: "Ésaïe",
      chapter: 41,
      verse: 10,
      ref: "Ésaïe 41:10",
      theme: "Foi & Confiance",
      text_lsg: "Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante.",
      text_pdv: "N'aie pas peur, je suis avec toi! Ne sois pas troublé, je suis ton Dieu! Je te rends fort, je viens à ton aide, je te soutiens de ma main droite victorieuse.",
      clues: [
        "Ancien Testament, parole prophétique de délivrance et d'alliance.",
        "L'ordre divin réitéré 'Ne crains rien' appuyé sur la promesse de la Présence active.",
        "Ésaïe 41, verset 10."
      ],
      context: "La fin de l'inquiétude ne découle pas d'une absence d'épreuves, mais de la main victorieuse qui nous soutient."
    },
    {
      id: "jr-29-11",
      book: "Jérémie",
      chapter: 29,
      verse: 11,
      ref: "Jérémie 29:11",
      theme: "Espérance",
      text_lsg: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
      text_pdv: "Moi, le Seigneur, je sais bien quels projets j'ai pour vous: ce sont des projets de paix et non de malheur, je veux vous donner un avenir plein d'espoir.",
      clues: [
        "Ancien Testament, prophète souvent surnommé 'le prophète pleureur' écrivant aux exilés de Babylone.",
        "Une promesse souveraine d'avenir lumineux écrite au cœur d'une lettre pastorale adressée à des captifs.",
        "Jérémie chapitre 29, verset 11."
      ],
      context: "Au moment même où les circonstances semblaient désespérées, Dieu révèle que ses desseins ultimes sont bienveillance et paix."
    },
    {
      id: "lam-3-22-23",
      book: "Lamentations",
      chapter: 3,
      verse: 22,
      ref: "Lamentations 3:22-23",
      theme: "Amour & Grâce",
      text_lsg: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme; elles se renouvellent chaque matin. Oh! que ta fidélité est grande!",
      text_pdv: "Les bontés du Seigneur ne sont pas finies, sa tendresse n'est pas épuisée. Elle recommence chaque matin. Oui, ta fidélité est grande!",
      clues: [
        "Ancien Testament, livre de deuil poétique suite à la destruction de Jérusalem.",
        "Le point culminant d'espérance situé exactement au centre d'un recueil de larmes.",
        "Lamentations chapitre 3, versets 22 et 23."
      ],
      context: "Chaque aube apporte un renouvellement immérité de la bienveillance divine, indépendamment de la nuit traversée."
    },
    {
      id: "jos-1-9",
      book: "Josué",
      chapter: 1,
      verse: 9,
      ref: "Josué 1:9",
      theme: "Victoire & Force",
      text_lsg: "Ne t'ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.",
      text_pdv: "Je te le répète: sois fort et courageux! N'aie pas peur et ne tremble pas, car moi, le Seigneur ton Dieu, je serai avec toi partout où tu iras.",
      clues: [
        "Ancien Testament, livre historique relatant l'entrée en terre promise.",
        "Commission divine solennelle transmise au successeur de Moïse avant de traverser le Jourdain.",
        "Josué chapitre 1, verset 9."
      ],
      context: "Le courage n'est pas l'absence de danger, mais l'obéissance audacieuse ancrée dans la présence promise de Dieu."
    },
    {
      id: "mt-6-33",
      book: "Matthieu",
      chapter: 6,
      verse: 33,
      ref: "Matthieu 6:33",
      theme: "Foi & Confiance",
      text_lsg: "Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.",
      text_pdv: "Cherchez d'abord le Royaume de Dieu et ce qui est juste à ses yeux, et Dieu vous donnera tout le reste en plus.",
      clues: [
        "Nouveau Testament, premier Évangile synoptique.",
        "Extrait du Sermon sur la montagne, réponse magistrale de Jésus à l'inquiétude matérielle.",
        "Matthieu chapitre 6, verset 33."
      ],
      context: "L'inversion radicale des priorités : mettre le Royaume au centre transforme toutes les autres nécessités en dons gracieux."
    },
    {
      id: "mt-11-28",
      book: "Matthieu",
      chapter: 11,
      verse: 28,
      ref: "Matthieu 11:28",
      theme: "Paix & Protection",
      text_lsg: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.",
      text_pdv: "Venez à moi, vous tous qui êtes fatigués de porter un lourd fardeau, et je vous donnerai le repos.",
      clues: [
        "Nouveau Testament, parole directe du Christ s'adressant aux cœurs écrasés par la vie ou le légalisme.",
        "L'invitation universelle au repos de l'âme sous son joug doux et léger.",
        "Matthieu chapitre 11, verset 28."
      ],
      context: "Jésus offre un repos profond et intérieur que ni les efforts religieux ni les solutions humaines ne peuvent procurer."
    },
    {
      id: "mt-28-19-20",
      book: "Matthieu",
      chapter: 28,
      verse: 19,
      ref: "Matthieu 28:19-20",
      theme: "Sagesse & Vérité",
      text_lsg: "Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit. Et voici, je suis avec vous tous les jours, jusqu'à la fin du monde.",
      text_pdv: "Allez donc! De toutes les nations faites des disciples. Baptisez-les au nom du Père, du Fils et de l'Esprit Saint. Apprenez-leur à garder tout ce que je vous ai commandé. Et moi, je suis avec vous tous les jours jusqu'à la fin du monde.",
      clues: [
        "Nouveau Testament, conclusion triomphante du premier Évangile.",
        "Connue sous le titre de la 'Grande Commission' donnée par le Christ ressuscité en Galilée.",
        "Matthieu chapitre 28, versets 19 et 20."
      ],
      context: "L'ordre missionnaire mondial soutenu par la promesse indéfectible de la présence du Christ à travers les âges."
    },
    {
      id: "jn-1-1",
      book: "Jean",
      chapter: 1,
      verse: 1,
      ref: "Jean 1:1",
      theme: "Sagesse & Vérité",
      text_lsg: "Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.",
      text_pdv: "Au commencement, la Parole existait déjà. La Parole était avec Dieu et la Parole était Dieu.",
      clues: [
        "Nouveau Testament, le quatrième Évangile, dit théologique et spirituel.",
        "Prologue grandiose faisant écho direct à la Genèse en révélant le Verbe éternel incarné.",
        "Jean chapitre 1, verset 1."
      ],
      context: "Origine du nom 'Verbum' : la Parole divine préexistante qui s'est faite chair pour éclairer tout homme."
    },
    {
      id: "jn-3-16",
      book: "Jean",
      chapter: 3,
      verse: 16,
      ref: "Jean 3:16",
      theme: "Amour & Grâce",
      text_lsg: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
      text_pdv: "Oui, Dieu a tellement aimé le monde qu'il a donné son Fils unique, afin que tous ceux qui croient en lui ne meurent pas mais aient la vie éternelle.",
      clues: [
        "Nouveau Testament, souvent qualifié de 'l'Évangile en miniature' ou du verset le plus célèbre au monde.",
        "Entretien nocturne entre Jésus et Nicodème, docteur de la loi.",
        "Jean chapitre 3, verset 16."
      ],
      context: "La synthèse suprême du plan du salut motivé par l'amour inconditionnel du Père pour l'humanité."
    },
    {
      id: "jn-8-32",
      book: "Jean",
      chapter: 8,
      verse: 32,
      ref: "Jean 8:32",
      theme: "Sagesse & Vérité",
      text_lsg: "Vous connaîtrez la vérité, et la vérité vous affranchira.",
      text_pdv: "Vous connaîtrez la vérité et la vérité vous rendra libres.",
      clues: [
        "Nouveau Testament, Évangile selon saint Jean.",
        "Discours de Jésus sur la liberté spirituelle authentique face à l'illusion du péché.",
        "Jean chapitre 8, verset 32."
      ],
      context: "La vérité n'est pas un concept abstrait, mais une personne et une parole qui brisent toute chaîne intérieure."
    },
    {
      id: "jn-14-6",
      book: "Jean",
      chapter: 14,
      verse: 6,
      ref: "Jean 14:6",
      theme: "Sagesse & Vérité",
      text_lsg: "Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.",
      text_pdv: "Jésus lui répond: C'est moi qui suis le chemin, la vérité et la vie. Personne ne va au Père sans passer par moi.",
      clues: [
        "Nouveau Testament, discours d'adieu dans la chambre haute avant la Passion.",
        "Réponse à l'apôtre Thomas contenant l'une des 7 déclarations exclusives 'Je Suis'.",
        "Jean chapitre 14, verset 6."
      ],
      context: "Le Christ ne montre pas simplement la voie : Il est la voie vivante reliant l'homme au Père."
    },
    {
      id: "jn-15-5",
      book: "Jean",
      chapter: 15,
      verse: 5,
      ref: "Jean 15:5",
      theme: "Foi & Confiance",
      text_lsg: "Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.",
      text_pdv: "Moi, je suis la vigne, et vous, vous êtes les branches. Si quelqu'un reste attaché à moi comme je reste attaché à lui, il porte beaucoup de fruits. En effet, sans moi, vous ne pouvez rien faire.",
      clues: [
        "Nouveau Testament, allégorie viticole de la communion spirituelle intime.",
        "Jésus rappelle l'absolue dépendance vitale de la branche envers le tronc pour fructifier.",
        "Jean chapitre 15, verset 5."
      ],
      context: "L'énergie spirituelle et la fécondité d'une vie chrétienne dépendent entièrement de l'attachement quotidien à Christ."
    },
    {
      id: "rm-8-28",
      book: "Romains",
      chapter: 8,
      verse: 28,
      ref: "Romains 8:28",
      theme: "Foi & Confiance",
      text_lsg: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.",
      text_pdv: "Nous savons aussi que Dieu fait concourir toutes choses au bien de ceux qui l'aiment, de ceux qu'il a appelés selon son projet.",
      clues: [
        "Nouveau Testament, épître maîtresse de l'apôtre Paul à la communauté de Rome.",
        "L'assurance souveraine que même les épreuves sont orchestrées par la grâce pour le bien éternel.",
        "Romains chapitre 8, verset 28."
      ],
      context: "Un ancrage inébranlable dans la providence de Dieu, qui tisse la trame des événements vers une finalité bénie."
    },
    {
      id: "rm-8-38-39",
      book: "Romains",
      chapter: 8,
      verse: 38,
      ref: "Romains 8:38-39",
      theme: "Amour & Grâce",
      text_lsg: "Car j'ai l'assurance que ni la mort ni la vie, ni les anges ni les dominations, ni les choses présentes ni les choses à venir, ni les puissances, ni la hauteur, ni la profondeur, ni aucune autre créature ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ notre Seigneur.",
      text_pdv: "Oui, j'en suis sûr: ni la mort, ni la vie, ni les anges, ni d'autres autorités, ni le présent, ni l'avenir, ni aucune puissance, ni les forces du ciel, ni les forces des profondeurs, ni aucune autre chose créée, rien ne pourra nous séparer de l'amour que Dieu nous a montré en Jésus-Christ notre Seigneur.",
      clues: [
        "Nouveau Testament, hymne triomphal culminant de l'épître aux Romains.",
        "Paul énumère dix puissances cosmiques et temporelles pour clamer la victoire absolue de l'amour divin.",
        "Romains chapitre 8, versets 38 et 39."
      ],
      context: "Aucune force visible ou invisible ne peut briser le lien indestructible scellé par le sacrifice du Christ."
    },
    {
      id: "rm-12-2",
      book: "Romains",
      chapter: 12,
      verse: 2,
      ref: "Romains 12:2",
      theme: "Sagesse & Vérité",
      text_lsg: "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.",
      text_pdv: "Ne suivez pas les habitudes du monde actuel, mais laissez Dieu vous transformer en renouvelant votre intelligence. Alors vous pourrez discerner ce que Dieu veut, ce qui est bon, ce qui lui plaît, ce qui est parfait.",
      clues: [
        "Nouveau Testament, passage pratique sur la consécration de l'esprit et la métamorphose intérieure.",
        "L'appel à ne pas entrer dans le moule de l'époque mais à laisser la Parole recalibrer nos pensées.",
        "Romains chapitre 12, verset 2."
      ],
      context: "La vie chrétienne commence par une transformation cognitive profonde orientée vers la volonté parfaite de Dieu."
    },
    {
      id: "1co-13-4-7",
      book: "1 Corinthiens",
      chapter: 13,
      verse: 4,
      ref: "1 Corinthiens 13:4-7",
      theme: "Amour & Grâce",
      text_lsg: "L'amour est patient, il est plein de bonté; l'amour n'est point envieux; l'amour ne se vante point, il ne s'enfle point d'orgueil, il ne fait rien de malhonnête, il ne cherche point son intérêt, il ne s'irrite point, il ne soupçonne point le mal, il ne se réjouit point de l'injustice, mais il se réjouit de la vérité; il excuse tout, il croit tout, il espère tout, il supporte tout.",
      text_pdv: "L'amour est patient, il est plein de bonté. L'amour n'est pas jaloux, il ne se vante pas, il ne s'enfle pas d'orgueil. L'amour ne fait rien de honteux, il ne cherche pas son propre intérêt, il ne s'emporte pas, il n'entretient pas de rancune. Il ne se réjouit pas de l'injustice, mais il trouve sa joie dans la vérité. L'amour pardonne tout, il croit tout, il espère tout, il endure tout.",
      clues: [
        "Nouveau Testament, le légendaire 'Hymne à l'amour' de Paul.",
        "Définit l'Agapé non comme une émotion passagère, mais comme une pratique active et désintéressée.",
        "1 Corinthiens chapitre 13, versets 4 à 7."
      ],
      context: "Sans l'amour, tous les dons d'éloquence, de foi ou de connaissance ne sont qu'une cymbale retentissante sans valeur durable."
    },
    {
      id: "2co-5-17",
      book: "2 Corinthiens",
      chapter: 5,
      verse: 17,
      ref: "2 Corinthiens 5:17",
      theme: "Amour & Grâce",
      text_lsg: "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.",
      text_pdv: "Si quelqu'un est uni au Christ, il est une nouvelle créature: les choses anciennes sont passées, voici, ce qui est nouveau est déjà là.",
      clues: [
        "Nouveau Testament, épître de Paul consacrée au ministère de la réconciliation.",
        "La proclamation de la régénération intérieure totale et du nouveau départ en Christ.",
        "2 Corinthiens chapitre 5, verset 17."
      ],
      context: "L'union avec le Christ n'est pas une simple amélioration morale, mais une recréation ontologique par la grâce."
    },
    {
      id: "2co-12-9",
      book: "2 Corinthiens",
      chapter: 12,
      verse: 9,
      ref: "2 Corinthiens 12:9",
      theme: "Victoire & Force",
      text_lsg: "Et il m'a dit: Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse. Je me glorifierai donc bien plus volontiers de mes faiblesses, afin que la puissance de Christ repose sur moi.",
      text_pdv: "Mais le Seigneur m'a dit: Ma grâce te suffit, car ma puissance donne toute sa mesure dans la faiblesse. C'est pourquoi je me vanterai bien plus volontiers de mes faiblesses, pour que la puissance du Christ habite en moi.",
      clues: [
        "Nouveau Testament, confidence poignante de Paul au sujet de son 'écharde dans la chair'.",
        "Le paradoxe divin : la force du ciel resplendit là où les capacités humaines s'effacent.",
        "2 Corinthiens chapitre 12, verset 9."
      ],
      context: "La dépendance humble vis-à-vis de la grâce devient le canal par lequel la force du Ressuscité se déploie sans entrave."
    },
    {
      id: "ga-5-22-23",
      book: "Galates",
      chapter: 5,
      verse: 22,
      ref: "Galates 5:22-23",
      theme: "Sagesse & Vérité",
      text_lsg: "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance; la loi n'est pas contre ces choses.",
      text_pdv: "Mais ce que l'Esprit Saint produit, c'est: amour, joie, paix, patience, bonté, bienveillance, fidélité, douceur, maîtrise de soi. La loi n'est certes pas contre de telles choses!",
      clues: [
        "Nouveau Testament, épître adressée aux églises de Galatie sur la liberté chrétienne.",
        "L'énumération des 9 vertus organiques produites par la vie selon l'Esprit.",
        "Galates chapitre 5, versets 22 et 23."
      ],
      context: "Le fruit ne se force pas par l'effort charnel ; il mûrit naturellement chez celui qui marche selon l'Esprit."
    },
    {
      id: "ep-2-8-9",
      book: "Éphésiens",
      chapter: 2,
      verse: 8,
      ref: "Éphésiens 2:8-9",
      theme: "Amour & Grâce",
      text_lsg: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Ce n'est point par les œuvres, afin que personne ne se glorifie.",
      text_pdv: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Cela ne vient pas de vous, c'est le don de Dieu. Ce n'est pas le résultat de vos efforts, personne ne peut donc se vanter.",
      clues: [
        "Nouveau Testament, la charte théologique du salut immérité écrite depuis la prison romaine.",
        "La distinction fondamentale entre le don gratuit de Dieu et toute tentative humaine d'auto-justification.",
        "Éphésiens chapitre 2, versets 8 et 9."
      ],
      context: "Le salut repose sur l'œuvre parfaite accomplie à la croix, reçue comme un cadeau immérité par la foi seule."
    },
    {
      id: "ph-4-6-7",
      book: "Philippiens",
      chapter: 4,
      verse: 6,
      ref: "Philippiens 4:6-7",
      theme: "Paix & Protection",
      text_lsg: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ.",
      text_pdv: "Ne vous inquiétez de rien, mais en toute circonstance demandez à Dieu dans la prière ce qu'il vous faut, et dites-lui merci. Et la paix de Dieu, qui dépasse tout ce qu'on peut imaginer, gardera votre cœur et vos pensées unis au Christ Jésus.",
      clues: [
        "Nouveau Testament, l'Épître de la joie écrite dans les fers.",
        "L'antidote biblique à l'anxiété : la prière d'action de grâces qui installe la sentinelle de la paix divine.",
        "Philippiens chapitre 4, versets 6 et 7."
      ],
      context: "La paix de Dieu agit comme une garde militaire autour de nos émotions et de notre esprit contre l'angoisse."
    },
    {
      id: "ph-4-13",
      book: "Philippiens",
      chapter: 4,
      verse: 13,
      ref: "Philippiens 4:13",
      theme: "Victoire & Force",
      text_lsg: "Je puis tout par celui qui me fortifie.",
      text_pdv: "Je peux tout grâce à celui qui me rend fort.",
      clues: [
        "Nouveau Testament, lettre de Paul aux Philippiens.",
        "Affirmation de contentement et d'endurance face à l'abondance comme face à la disette.",
        "Philippiens chapitre 4, verset 13."
      ],
      context: "Paul n'affirme pas une puissance magique, mais sa capacité à tout affronter et endurer par la force du Christ."
    },
    {
      id: "2tm-1-7",
      book: "2 Timothée",
      chapter: 1,
      verse: 7,
      ref: "2 Timothée 1:7",
      theme: "Victoire & Force",
      text_lsg: "Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse.",
      text_pdv: "En effet, l'Esprit que Dieu nous a donné ne fait pas de nous des lâches. Au contraire, cet Esprit nous remplit de force, d'amour et de maîtrise de soi.",
      clues: [
        "Nouveau Testament, testament spirituel de Paul adressé à son jeune collaborateur Timothée.",
        "Rappelle la nature de l'Esprit saint face à la peur et aux intimidations du monde extérieur.",
        "2 Timothée chapitre 1, verset 7."
      ],
      context: "La timidité paralysante ne vient pas de Dieu : son Esprit équipe le croyant de fermeté, d'amour et de calme discernement."
    },
    {
      id: "he-11-1",
      book: "Hébreux",
      chapter: 11,
      verse: 1,
      ref: "Hébreux 11:1",
      theme: "Foi & Confiance",
      text_lsg: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.",
      text_pdv: "Mettre sa foi en Dieu, c'est être sûr de ce qu'on espère, c'est être convaincu de ce qu'on ne voit pas.",
      clues: [
        "Nouveau Testament, grande lettre sacerdotale sur la supériorité de la nouvelle alliance.",
        "L'ouverture du célèbre panthéon des héros de la foi d'Hébreux 11.",
        "Hébreux chapitre 11, verset 1."
      ],
      context: "La foi n'est pas un espoir vague mais une certitude substantielle qui anticipe les réalités invisibles de Dieu."
    },
    {
      id: "jc-1-22",
      book: "Jacques",
      chapter: 1,
      verse: 22,
      ref: "Jacques 1:22",
      theme: "Sagesse & Vérité",
      text_lsg: "Mettez en pratique la parole, et ne vous bornez pas à l'écouter, en vous trompant vous-mêmes par de faux raisonnements.",
      text_pdv: "Ne vous contentez pas d'écouter la parole, mettez-la en pratique! Sinon, vous vous trompez vous-mêmes.",
      clues: [
        "Nouveau Testament, épître pratique et incisive de Jacques, frère du Seigneur.",
        "L'avertissement contre l'illusion d'une orthodoxie passive qui n'engendre pas d'obéissance concrète.",
        "Jacques chapitre 1, verset 22."
      ],
      context: "La Parole de Dieu est un miroir destiné à conduire à l'action fidèle, et non à une contemplation stérile."
    },
    {
      id: "1pi-5-7",
      book: "1 Pierre",
      chapter: 5,
      verse: 7,
      ref: "1 Pierre 5:7",
      theme: "Paix & Protection",
      text_lsg: "Et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.",
      text_pdv: "Déchargez-vous sur lui de tous vos soucis, car il prend soin de vous.",
      clues: [
        "Nouveau Testament, première épître de l'apôtre Pierre aux croyants dispersés et persécutés.",
        "L'injonction pastorale de transférer le fardeau de nos angoisses sur les épaules bienveillantes du Père.",
        "1 Pierre chapitre 5, verset 7."
      ],
      context: "Dieu ne nous demande pas de porter l'anxiété du lendemain : sa providence active veille sur chacun de ses enfants."
    },
    {
      id: "1jn-4-18",
      book: "1 Jean",
      chapter: 4,
      verse: 18,
      ref: "1 Jean 4:18",
      theme: "Amour & Grâce",
      text_lsg: "La crainte n'est pas dans l'amour, mais l'amour parfait bannit la crainte; car la crainte suppose un châtiment, et celui qui craint n'est pas parfait dans l'amour.",
      text_pdv: "Il n'y a pas de peur dans l'amour. Au contraire, l'amour parfait chasse la peur. En effet, la peur suppose la punition, et celui qui a peur n'est pas parfait dans l'amour.",
      clues: [
        "Nouveau Testament, première lettre de l'apôtre Jean axée sur la communion fraternelle et la lumière.",
        "L'affirmation révolutionnaire que l'amour authentique dissipe toute terreur du jugement.",
        "1 Jean chapitre 4, verset 18."
      ],
      context: "Quand le croyant prend conscience de la plénitude de l'amour de Dieu pour lui, la peur du châtiment s'évanouit."
    },
    {
      id: "ap-3-20",
      book: "Apocalypse",
      chapter: 3,
      verse: 20,
      ref: "Apocalypse 3:20",
      theme: "Amour & Grâce",
      text_lsg: "Voici, je me tiens à la porte, et je frappe. Si quelqu'un entend ma voix et ouvre la porte, j'entrerai chez lui, je souperai avec lui, et lui avec moi.",
      text_pdv: "Écoute, je me tiens à la porte et je frappe. Si quelqu'un entend ma voix et ouvre la porte, j'entrerai chez lui, je prendrai le repas avec lui et lui avec moi.",
      clues: [
        "Nouveau Testament, le livre de la Révélation prophétique de saint Jean sur l'île de Patmos.",
        "Lettre poignante à l'église tiède de Laodicée où le Christ attend humblement à la porte du cœur.",
        "Apocalypse chapitre 3, verset 20."
      ],
      context: "Une scène de grâce et d'intimité où le Seigneur sollicite avec douceur la permission de communier avec l'homme."
    }
  ];

  // ==========================================================================
  // 2. État Global de l'Application
  // ==========================================================================
  const state = {
    currentVerse: BIBLE_VERSES[0],
    currentVersion: 'lsg',
    currentAssist: 'open', // 'open' | 'first-letters' | 'cloze' | 'blank'
    userCustomVerse: null,

    // Detective Mode State
    detectiveVerse: null,
    detectiveCluesUnlocked: 0,
    detectiveSolved: false,

    // Flash Quiz State
    quizIndex: 0,
    quizScore: 0,
    quizStreak: 0,
    quizTotalQuestions: 10,
    quizSessionPool: [],
    quizAnswerLocked: false,

    // Audio & Theme
    theme: localStorage.getItem('vb_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    audioPlaying: false
  };

  // LocalStorage stats
  function getStats() {
    try {
      const s = localStorage.getItem('verbum_stats');
      return s ? JSON.parse(s) : {
        practicedVerses: {},
        totalAttempts: 0,
        totalAccuracySum: 0,
        streak: 0,
        bestStreak: 0,
        lastPracticeDate: null
      };
    } catch (e) {
      return { practicedVerses: {}, totalAttempts: 0, totalAccuracySum: 0, streak: 0, bestStreak: 0, lastPracticeDate: null };
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem('verbum_stats', JSON.stringify(stats));
    } catch (e) {
      console.warn("Impossible d'enregistrer les stats dans localStorage", e);
    }
  }

  // ==========================================================================
  // 3. Outils de Traitement de Texte & Algorithme Diff NLP
  // ==========================================================================

  /**
   * Nettoie et normalise une chaîne de caractères pour une comparaison souple.
   */
  function normalizeWord(w) {
    if (!w) return "";
    return w
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime accents
      .replace(/[^a-z0-9]/g, ""); // Ne garde que lettres et chiffres
  }

  /**
   * Découpe un texte en jetons (tokens) préservant la ponctuation pour l'affichage.
   */
  function tokenize(text) {
    if (!text) return [];
    // Découpe par espaces et apostrophes
    const rawTokens = text.trim().split(/\s+/);
    return rawTokens.map(raw => {
      // Sépare ponctuation début/fin
      const match = raw.match(/^([«"'({\[]*)(.*?)([.,!?:;»"')}\]]*)$/);
      const prefix = match ? match[1] : "";
      const core = match ? match[2] : raw;
      const suffix = match ? match[3] : "";
      return {
        raw,
        prefix,
        core,
        suffix,
        norm: normalizeWord(core)
      };
    });
  }

  /**
   * Distance de Levenshtein entre deux mots normalisés
   */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        let val;
        if (a[i - 1] === b[j - 1]) {
          val = row[j - 1];
        } else {
          val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
        }
        row[j - 1] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  /**
   * Algorithme d'alignement mot-à-mot inspiré de Needleman-Wunsch / LCS
   */
  function alignWords(canonicalTokens, userTokens) {
    const n = canonicalTokens.length;
    const m = userTokens.length;

    // Matrice de coût
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 0; i <= n; i++) dp[i][0] = i * 2;
    for (let j = 0; j <= m; j++) dp[0][j] = j * 2;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const can = canonicalTokens[i - 1];
        const usr = userTokens[j - 1];

        let matchCost = 2; // divergence par défaut
        if (can.norm === usr.norm && can.core === usr.core) {
          matchCost = 0; // exact
        } else if (can.norm === usr.norm) {
          matchCost = 0.5; // juste accent ou casse
        } else {
          const dist = levenshtein(can.norm, usr.norm);
          if (dist === 1 && can.norm.length >= 3) {
            matchCost = 1.0; // petite coquille
          } else if (dist <= 2 && can.norm.length >= 6) {
            matchCost = 1.2;
          }
        }

        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + matchCost, // substitution/match
          dp[i - 1][j] + 2,             // suppression (mot manquant)
          dp[i][j - 1] + 2              // insertion (mot superflu)
        );
      }
    }

    // Backtrack pour reconstruire l'alignement
    let i = n, j = m;
    const userDiff = [];
    const canonDiff = [];
    let exactCount = 0;
    let typoCount = 0;
    let errorCount = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const can = canonicalTokens[i - 1];
        const usr = userTokens[j - 1];
        const dist = levenshtein(can.norm, usr.norm);

        // Correspondance parfaite ou mineure
        if (can.norm === usr.norm || (dist <= 2 && can.norm.length >= 4)) {
          let status = 'exact';
          if (can.core !== usr.core || dist > 0) {
            status = 'typo';
            typoCount++;
          } else {
            exactCount++;
          }

          userDiff.unshift({ word: usr.raw, status, expected: can.raw });
          canonDiff.unshift({ word: can.raw, status: 'canonical' });
          i--;
          j--;
          continue;
        }
      }

      // Mot manquant ou superflu
      if (i > 0 && (j === 0 || dp[i - 1][j] <= dp[i][j - 1])) {
        // Mot manquant dans la saisie de l'utilisateur
        const can = canonicalTokens[i - 1];
        canonDiff.unshift({ word: can.raw, status: 'missing-highlight' });
        errorCount++;
        i--;
      } else if (j > 0) {
        // Mot superflu inséré par l'utilisateur
        const usr = userTokens[j - 1];
        userDiff.unshift({ word: usr.raw, status: 'wrong' });
        errorCount++;
        j--;
      }
    }

    const accuracy = n > 0
      ? Math.max(0, Math.round(((exactCount * 1.0 + typoCount * 0.7) / n) * 100))
      : 0;

    return {
      accuracy,
      exactCount,
      typoCount,
      errorCount,
      userDiff,
      canonDiff
    };
  }

  // ==========================================================================
  // 4. Initialisation & Remplissage de l'UI
  // ==========================================================================
  function init() {
    initTheme();
    populateFilters();
    populateDatalist();
    renderStatsRibbon();
    setupEventListeners();
    setupKeyboardNavigation();

    // Charge premier verset
    loadVerse(BIBLE_VERSES[0]);

    // Initialise mode Détective et Flash Quiz
    initDetective();
    initQuiz();
    renderBiblioDirectory();
  }

  function initTheme() {
    const isDark = state.theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('vb_theme', state.theme);
    initTheme();
  }

  function populateFilters() {
    const bookSelect = document.getElementById('graver-book-select');
    const themeSelect = document.getElementById('graver-theme-select');

    if (!bookSelect || !themeSelect) return;

    // Livres uniques
    const books = Array.from(new Set(BIBLE_VERSES.map(v => v.book))).sort();
    books.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      bookSelect.appendChild(opt);
    });

    // Thèmes uniques
    const themes = Array.from(new Set(BIBLE_VERSES.map(v => v.theme))).sort();
    themes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      themeSelect.appendChild(opt);
    });
  }

  function populateDatalist() {
    const datalist = document.getElementById('bible-books-datalist');
    if (!datalist) return;
    const books = Array.from(new Set(BIBLE_VERSES.map(v => v.book))).sort();
    datalist.innerHTML = books.map(b => `<option value="${b}">`).join('');
  }

  function renderStatsRibbon() {
    const stats = getStats();
    const countEl = document.getElementById('ribbon-count');
    const accEl = document.getElementById('ribbon-accuracy');
    const streakEl = document.getElementById('ribbon-streak');

    const practicedCount = Object.keys(stats.practicedVerses || {}).length;
    const avgAcc = stats.totalAttempts > 0
      ? Math.round(stats.totalAccuracySum / stats.totalAttempts)
      : 100;

    if (countEl) countEl.textContent = practicedCount;
    if (accEl) accEl.textContent = `${avgAcc}%`;
    if (streakEl) streakEl.textContent = `🔥 ${stats.streak || 0}`;

    // Met à jour aussi les stats de l'onglet Bibliothèque
    const totalP = document.getElementById('stat-total-practiced');
    const avgA = document.getElementById('stat-avg-accuracy');
    const bStreak = document.getElementById('stat-best-streak');
    const mLevel = document.getElementById('stat-mastery-level');

    if (totalP) totalP.textContent = practicedCount;
    if (avgA) avgA.textContent = `${avgAcc}%`;
    if (bStreak) bStreak.textContent = stats.bestStreak || 0;
    if (mLevel) {
      if (practicedCount >= 30) mLevel.textContent = "Théologien";
      else if (practicedCount >= 15) mLevel.textContent = "Scribe";
      else if (practicedCount >= 5) mLevel.textContent = "Disciple";
      else mLevel.textContent = "Initié";
    }
  }

  // ==========================================================================
  // 5. Logique Mode 1 : GRAVER (Dictée & Mémorisation)
  // ==========================================================================
  function loadVerse(verse) {
    state.currentVerse = verse;

    // Badges
    const refBadge = document.getElementById('verse-ref');
    const themeBadge = document.getElementById('verse-theme-tag');
    const versionBadge = document.getElementById('verse-version-tag');
    const contextEl = document.getElementById('verse-context-text');

    if (refBadge) refBadge.textContent = verse.ref;
    if (themeBadge) themeBadge.textContent = verse.theme;
    if (versionBadge) {
      versionBadge.textContent = state.currentVersion === 'pdv'
        ? 'Parole de Vie'
        : 'Louis Segond 1910';
    }
    if (contextEl) contextEl.textContent = verse.context || "Méditez chaque parole avec attention.";

    // Affiche le texte selon le niveau d'assistance
    updatePromptDisplay();

    // Réinitialise la zone de frappe et l'analyse
    const textarea = document.getElementById('practice-input');
    if (textarea) {
      textarea.value = "";
      updateCounters();
      textarea.focus();
    }

    const analysisCard = document.getElementById('analysis-card');
    if (analysisCard) analysisCard.hidden = true;
  }

  function getCanonicalText() {
    if (state.userCustomVerse && state.currentVerse.id === 'custom') {
      return state.userCustomVerse.text;
    }
    return state.currentVersion === 'pdv'
      ? state.currentVerse.text_pdv
      : state.currentVerse.text_lsg;
  }

  function updatePromptDisplay() {
    const container = document.getElementById('verse-prompt-text');
    if (!container) return;

    const fullText = getCanonicalText();
    container.className = 'vb-prompt-text';

    if (state.currentAssist === 'open') {
      container.textContent = `« ${fullText} »`;
    } else if (state.currentAssist === 'first-letters') {
      const tokens = fullText.split(/\s+/);
      const transformed = tokens.map(tok => {
        const firstLetter = tok.replace(/[^a-zA-ZÀ-ÿ0-9]/g, "").charAt(0);
        if (!firstLetter) return tok;
        return `<span class="first-letter-hint">${firstLetter}</span><span class="first-letter-dots">...</span>`;
      }).join(' ');
      container.innerHTML = `« ${transformed} »`;
    } else if (state.currentAssist === 'cloze') {
      const tokens = fullText.split(/\s+/);
      const stopwords = new Set(['le','la','les','de','du','des','un','une','et','en','à','dans','par','pour','sur','qui','que','ne','pas','se','ce','qui','est','son','sa','ses']);
      let clozeIndex = 0;
      const transformed = tokens.map(tok => {
        const norm = normalizeWord(tok);
        if (norm.length > 3 && !stopwords.has(norm) && (clozeIndex++ % 2 === 0)) {
          return `<span class="cloze-hole" title="Mot masqué">${tok}</span>`;
        }
        return tok;
      }).join(' ');
      container.innerHTML = `« ${transformed} »`;
    } else if (state.currentAssist === 'blank') {
      container.classList.add('mode-blank');
      container.innerHTML = `<em>📜 Verset masqué — Restitution de mémoire intégrale</em>`;
    }
  }

  function updateCounters() {
    const input = document.getElementById('practice-input');
    const charEl = document.getElementById('char-count');
    const wordEl = document.getElementById('word-count');
    if (!input || !charEl || !wordEl) return;

    const val = input.value;
    charEl.textContent = val.length;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    wordEl.textContent = words;
  }

  function analyzeTyping() {
    const input = document.getElementById('practice-input');
    if (!input) return;
    const userText = input.value.trim();

    if (!userText) {
      alert("Veuillez saisir votre verset de mémoire avant d'analyser.");
      input.focus();
      return;
    }

    const canonicalText = getCanonicalText();
    const canTokens = tokenize(canonicalText);
    const usrTokens = tokenize(userText);

    const result = alignWords(canTokens, usrTokens);

    // Affiche la carte d'analyse
    const analysisCard = document.getElementById('analysis-card');
    if (!analysisCard) return;
    analysisCard.hidden = false;

    // Score & verdict
    const percentEl = document.getElementById('score-percent');
    const verdictEl = document.getElementById('score-verdict');
    const summaryEl = document.getElementById('score-summary');
    const circleEl = document.getElementById('score-circle');

    if (percentEl) percentEl.textContent = `${result.accuracy}%`;

    if (result.accuracy === 100) {
      verdictEl.textContent = "Parfaitement gravé ! 🏆";
      summaryEl.textContent = "Exactitude absolue mot pour mot. Votre mémoire a restitué le passage avec une fidélité remarquable.";
      if (circleEl) circleEl.style.borderColor = "#3ca330";
    } else if (result.accuracy >= 85) {
      verdictEl.textContent = "Excellent travail ! 🌟";
      summaryEl.textContent = "Le verset est très bien maîtrisé. Seules quelques coquilles ou nuances grammaticales subsistent.";
      if (circleEl) circleEl.style.borderColor = "#b88d3e";
    } else if (result.accuracy >= 65) {
      verdictEl.textContent = "Bonne mémorisation globale 👍";
      summaryEl.textContent = "Le sens général est là, mais plusieurs mots ou expressions clés nécessitent un réajustement.";
      if (circleEl) circleEl.style.borderColor = "#d4930d";
    } else {
      verdictEl.textContent = "À retravailler pas à pas ✍️";
      summaryEl.textContent = "Rapprochez-vous du texte authentique. Utilisez le mode 'Premières lettres' ou 'Texte à trous' pour vous guider.";
      if (circleEl) circleEl.style.borderColor = "#a7422d";
    }

    // Stats badges
    const statExact = document.getElementById('stat-exact-words');
    const statTypos = document.getElementById('stat-typos');
    const statMissing = document.getElementById('stat-missing');

    if (statExact) statExact.textContent = `${result.exactCount} mots exacts`;
    if (statTypos) statTypos.textContent = `${result.typoCount} coquilles`;
    if (statMissing) statMissing.textContent = `${result.errorCount} erreurs/oublis`;

    // Rendu annoté
    const userDiffEl = document.getElementById('diff-user-output');
    const canonDiffEl = document.getElementById('diff-canonical-output');

    if (userDiffEl) {
      userDiffEl.innerHTML = result.userDiff.map(item => {
        let title = item.status === 'exact' ? 'Exact' : (item.status === 'typo' ? `Attendu : ${item.expected}` : 'Erreur');
        return `<span class="diff-token ${item.status}" title="${title}">${escapeHtml(item.word)}</span>`;
      }).join(' ');
    }

    if (canonDiffEl) {
      canonDiffEl.innerHTML = `« ${escapeHtml(canonicalText)} »`;
    }

    // Mise à jour des stats globales
    recordPracticeSession(result.accuracy);

    // Scroll doux vers l'analyse
    analysisCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function recordPracticeSession(accuracy) {
    const stats = getStats();
    const vid = state.currentVerse.id;

    if (!stats.practicedVerses) stats.practicedVerses = {};
    if (!stats.practicedVerses[vid]) {
      stats.practicedVerses[vid] = { count: 0, bestAccuracy: 0 };
    }

    stats.practicedVerses[vid].count++;
    stats.practicedVerses[vid].bestAccuracy = Math.max(stats.practicedVerses[vid].bestAccuracy, accuracy);

    stats.totalAttempts = (stats.totalAttempts || 0) + 1;
    stats.totalAccuracySum = (stats.totalAccuracySum || 0) + accuracy;

    // Calcul de streak quotidien
    const today = new Date().toISOString().slice(0, 10);
    if (stats.lastPracticeDate !== today) {
      stats.streak = (stats.streak || 0) + 1;
      stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak);
      stats.lastPracticeDate = today;
    }

    saveStats(stats);
    renderStatsRibbon();
  }

  // ==========================================================================
  // 6. Logique Mode 2 : DÉTECTIVE (Deviner la référence)
  // ==========================================================================
  function initDetective() {
    // Choisit un verset au hasard
    pickDetectiveVerse();
  }

  function pickDetectiveVerse() {
    const randIndex = Math.floor(Math.random() * BIBLE_VERSES.length);
    state.detectiveVerse = BIBLE_VERSES[randIndex];
    state.detectiveCluesUnlocked = 0;
    state.detectiveSolved = false;

    const quoteEl = document.getElementById('detective-quote');
    const themeEl = document.getElementById('detective-theme-tag');
    const versionEl = document.getElementById('detective-version-tag');
    const cluesList = document.getElementById('detective-clues-list');
    const cluesCount = document.getElementById('clues-left-count');
    const feedback = document.getElementById('detective-feedback');
    const nextBtn = document.getElementById('detective-next-btn');

    if (quoteEl) quoteEl.textContent = `« ${state.detectiveVerse.text_lsg} »`;
    if (themeEl) themeEl.textContent = state.detectiveVerse.theme;
    if (versionEl) versionEl.textContent = 'Louis Segond 1910';
    if (cluesList) cluesList.innerHTML = '';
    if (cluesCount) cluesCount.textContent = '3 restants';
    if (feedback) feedback.hidden = true;
    if (nextBtn) nextBtn.hidden = true;

    // Reset inputs
    const bookInp = document.getElementById('detective-book-input');
    const chapInp = document.getElementById('detective-chapter-input');
    const versInp = document.getElementById('detective-verse-input');
    const dirInp = document.getElementById('detective-direct-input');

    if (bookInp) bookInp.value = '';
    if (chapInp) chapInp.value = '';
    if (versInp) versInp.value = '';
    if (dirInp) dirInp.value = '';
  }

  function unlockDetectiveClue() {
    if (state.detectiveSolved) return;
    if (state.detectiveCluesUnlocked >= 3) {
      alert("Tous les indices disponibles ont déjà été révélés !");
      return;
    }

    const clueText = state.detectiveVerse.clues[state.detectiveCluesUnlocked];
    state.detectiveCluesUnlocked++;

    const cluesList = document.getElementById('detective-clues-list');
    if (cluesList) {
      const clueItem = document.createElement('div');
      clueItem.className = 'vb-clue-item';
      clueItem.innerHTML = `<strong>Indice ${state.detectiveCluesUnlocked} :</strong> ${clueText}`;
      cluesList.appendChild(clueItem);
    }

    const cluesCount = document.getElementById('clues-left-count');
    if (cluesCount) {
      const left = 3 - state.detectiveCluesUnlocked;
      cluesCount.textContent = `${left} restant${left > 1 ? 's' : ''}`;
    }
  }

  function validateDetectiveGuess() {
    const target = state.detectiveVerse;
    const directVal = (document.getElementById('detective-direct-input')?.value || '').trim();
    const bookVal = (document.getElementById('detective-book-input')?.value || '').trim();
    const chapVal = parseInt(document.getElementById('detective-chapter-input')?.value, 10);
    const versVal = parseInt(document.getElementById('detective-verse-input')?.value, 10);

    let isMatch = false;

    // Vérification de la saisie directe
    if (directVal) {
      const normDirect = normalizeWord(directVal);
      const targetNorm = normalizeWord(`${target.book}${target.chapter}${target.verse}`);
      // Vérifie aussi abbréviations courantes (ex: Ps, Rom, Mt, Jn, Pr...)
      const normBook = normalizeWord(target.book);
      const isBookMatch = normDirect.includes(normBook) ||
        (normBook === 'psaumes' && normDirect.includes('ps')) ||
        (normBook === 'matthieu' && normDirect.includes('mt')) ||
        (normBook === 'romains' && normDirect.includes('rm')) ||
        (normBook === 'proverbes' && normDirect.includes('pr')) ||
        (normBook === 'jean' && normDirect.includes('jn'));

      const hasChap = normDirect.includes(target.chapter.toString());
      if (isBookMatch && hasChap) {
        isMatch = true;
      }
    } else {
      // Vérification des champs distincts
      const normInputBook = normalizeWord(bookVal);
      const normTargetBook = normalizeWord(target.book);
      const bookOk = normInputBook === normTargetBook ||
        (normTargetBook === 'psaumes' && (normInputBook === 'ps' || normInputBook === 'psaume')) ||
        (normTargetBook === 'matthieu' && normInputBook === 'mt') ||
        (normTargetBook === 'romains' && normInputBook === 'rm') ||
        (normTargetBook === 'jean' && normInputBook === 'jn') ||
        (normTargetBook === 'proverbes' && (normInputBook === 'pr' || normInputBook === 'proverbe'));

      const chapOk = chapVal === target.chapter;
      const versOk = isNaN(versVal) || versVal === target.verse; // verset facultatif pour être indulgent

      if (bookOk && chapOk) {
        isMatch = true;
      }
    }

    const feedback = document.getElementById('detective-feedback');
    const nextBtn = document.getElementById('detective-next-btn');
    if (!feedback) return;
    feedback.hidden = false;

    if (isMatch) {
      state.detectiveSolved = true;
      const earned = Math.max(40, 100 - state.detectiveCluesUnlocked * 20);
      feedback.className = 'vb-feedback-banner success';
      feedback.innerHTML = `
        <h4 style="margin:0 0 0.4rem; font-family:var(--vb-serif); font-size:1.25rem;">🎉 Bravo ! Excellente déduction biblique !</h4>
        <p style="margin:0 0 0.6rem;">Il s'agissait bien de <strong>${target.ref}</strong> (+${earned} points).</p>
        <p style="margin:0; font-size:0.9rem; font-style:italic;">${target.context}</p>
      `;
      if (nextBtn) nextBtn.hidden = false;
      recordPracticeSession(100);
    } else {
      feedback.className = 'vb-feedback-banner failure';
      feedback.innerHTML = `
        <h4 style="margin:0 0 0.4rem; font-family:var(--vb-serif); font-size:1.25rem;">Pas tout à fait...</h4>
        <p style="margin:0;">Vérifiez le livre ou le numéro de chapitre. Utilisez un indice si vous hésitez !</p>
      `;
    }
  }

  function giveUpDetective() {
    const target = state.detectiveVerse;
    const feedback = document.getElementById('detective-feedback');
    const nextBtn = document.getElementById('detective-next-btn');
    if (!feedback) return;
    feedback.hidden = false;
    feedback.className = 'vb-feedback-banner failure';
    feedback.innerHTML = `
      <h4 style="margin:0 0 0.4rem; font-family:var(--vb-serif); font-size:1.25rem;">Solution révélée</h4>
      <p style="margin:0 0 0.6rem;">La référence exacte était <strong>${target.ref}</strong>.</p>
      <p style="margin:0; font-size:0.9rem; font-style:italic;">${target.context}</p>
    `;
    if (nextBtn) nextBtn.hidden = false;
  }

  // ==========================================================================
  // 7. Logique Mode 3 : FLASH QUIZZ (QCM Référence ➔ Verset)
  // ==========================================================================
  function initQuiz() {
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizStreak = 0;
    state.quizAnswerLocked = false;

    // Mélange le catalogue et prend 10 questions
    const shuffled = [...BIBLE_VERSES].sort(() => 0.5 - Math.random());
    state.quizSessionPool = shuffled.slice(0, state.quizTotalQuestions);

    const resultsCard = document.getElementById('quiz-results-card');
    const quizCard = document.querySelector('.vb-quiz-card');
    const optionsCont = document.getElementById('quiz-options-container');
    const footer = document.getElementById('quiz-footer');

    if (resultsCard) resultsCard.hidden = true;
    if (quizCard) quizCard.hidden = false;
    if (optionsCont) optionsCont.hidden = false;
    if (footer) footer.hidden = true;

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    state.quizAnswerLocked = false;
    const target = state.quizSessionPool[state.quizIndex];
    if (!target) {
      showQuizResults();
      return;
    }

    // UI Stats
    const currentQEl = document.getElementById('quiz-current-q');
    const currentScoreEl = document.getElementById('quiz-current-score');
    const streakEl = document.getElementById('quiz-streak');
    const progressFill = document.getElementById('quiz-progress-fill');
    const targetRefEl = document.getElementById('quiz-target-ref');
    const themeHintEl = document.getElementById('quiz-theme-hint');
    const footer = document.getElementById('quiz-footer');

    if (currentQEl) currentQEl.textContent = state.quizIndex + 1;
    if (currentScoreEl) currentScoreEl.textContent = state.quizScore;
    if (streakEl) streakEl.textContent = `🔥 ${state.quizStreak}`;
    if (progressFill) progressFill.style.width = `${((state.quizIndex + 1) / state.quizTotalQuestions) * 100}%`;
    if (targetRefEl) targetRefEl.textContent = target.ref;
    if (themeHintEl) themeHintEl.textContent = `Thématique : ${target.theme}`;
    if (footer) footer.hidden = true;

    // Choix des 3 distracteurs
    const distractors = BIBLE_VERSES.filter(v => v.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Mélange les 4 propositions
    const options = [target, ...distractors].sort(() => 0.5 - Math.random());

    const container = document.getElementById('quiz-options-container');
    if (!container) return;
    container.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vb-quiz-option';
      btn.innerHTML = `
        <span class="vb-quiz-letter">${letters[idx]}</span>
        <span>« ${opt.text_lsg} »</span>
      `;
      btn.addEventListener('click', () => handleQuizAnswer(opt.id === target.id, btn, target));
      container.appendChild(btn);
    });
  }

  function handleQuizAnswer(isCorrect, selectedBtn, targetVerse) {
    if (state.quizAnswerLocked) return;
    state.quizAnswerLocked = true;

    const allButtons = document.querySelectorAll('.vb-quiz-option');
    allButtons.forEach(btn => btn.classList.add('locked'));

    playAudioChime(isCorrect);

    if (isCorrect) {
      selectedBtn.classList.add('correct');
      state.quizScore += 100;
      state.quizStreak++;
    } else {
      selectedBtn.classList.add('wrong');
      state.quizStreak = 0;
      // Met en évidence la bonne réponse
      allButtons.forEach(btn => {
        if (btn.textContent.includes(targetVerse.text_lsg.slice(0, 20))) {
          btn.classList.add('correct');
        }
      });
    }

    // Explication et bouton Suivant
    const footer = document.getElementById('quiz-footer');
    const explEl = document.getElementById('quiz-explanation-text');
    if (footer && explEl) {
      footer.hidden = false;
      explEl.innerHTML = `
        <strong>${targetVerse.ref} :</strong> ${targetVerse.context || "Un verset fondateur des Écritures."}
      `;
    }
  }

  function showQuizResults() {
    const resultsCard = document.getElementById('quiz-results-card');
    const quizCard = document.querySelector('.vb-quiz-card');
    const optionsCont = document.getElementById('quiz-options-container');
    const footer = document.getElementById('quiz-footer');

    if (quizCard) quizCard.hidden = true;
    if (optionsCont) optionsCont.hidden = true;
    if (footer) footer.hidden = true;
    if (resultsCard) resultsCard.hidden = false;

    const finalScoreEl = document.getElementById('quiz-final-score');
    const finalMsgEl = document.getElementById('quiz-final-msg');
    const trophyEl = document.getElementById('quiz-trophy');

    const totalPts = state.quizScore;
    const correctCount = Math.round(totalPts / 100);

    if (finalScoreEl) finalScoreEl.textContent = `Score final : ${correctCount} / 10 (${totalPts} pts)`;

    if (correctCount === 10) {
      if (trophyEl) trophyEl.textContent = '🏆';
      if (finalMsgEl) finalMsgEl.textContent = "Score parfait ! Votre familiarité avec les Écritures est exemplaire.";
    } else if (correctCount >= 8) {
      if (trophyEl) trophyEl.textContent = '⭐';
      if (finalMsgEl) finalMsgEl.textContent = "Remarquable score ! Vous possédez une assise biblique très solide.";
    } else if (correctCount >= 5) {
      if (trophyEl) trophyEl.textContent = '📖';
      if (finalMsgEl) finalMsgEl.textContent = "Bon niveau ! Continuez à graver ces passages régulièrement pour affiner vos réflexes.";
    } else {
      if (trophyEl) trophyEl.textContent = '🌱';
      if (finalMsgEl) finalMsgEl.textContent = "Chaque graine semée porte son fruit. N'hésitez pas à relire les textes dans la bibliothèque !";
    }

    recordPracticeSession(correctCount * 10);
  }

  // Petit carillon sonore synthétisé avec l'API Web Audio (aucun fichier externe requis)
  function playAudioChime(success) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(174.61, ctx.currentTime + 0.2); // F3
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio silencieux si non supporté
    }
  }

  // ==========================================================================
  // 8. Récitation Vocale (Web Speech API)
  // ==========================================================================
  function speakCurrentVerse() {
    if (!('speechSynthesis' in window)) {
      alert("La synthèse vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      return;
    }

    const textToRead = `${state.currentVerse.ref}. ${getCanonicalText()}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95; // Cadence posée et claire
    utterance.pitch = 1.0;

    // Recherche d'une voix française naturelle si dispo
    const voices = synth.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Thomas') || v.name.includes('Amelie')));
    if (frVoice) utterance.voice = frVoice;

    synth.speak(utterance);
  }

  // ==========================================================================
  // 9. Bibliothèque & Index des versets
  // ==========================================================================
  function renderBiblioDirectory(filterText = "") {
    const listEl = document.getElementById('biblio-verses-list');
    if (!listEl) return;

    const term = normalizeWord(filterText);
    const filtered = BIBLE_VERSES.filter(v => {
      if (!term) return true;
      return normalizeWord(v.ref).includes(term) ||
             normalizeWord(v.theme).includes(term) ||
             normalizeWord(v.text_lsg).includes(term) ||
             normalizeWord(v.book).includes(term);
    });

    listEl.innerHTML = '';
    if (filtered.length === 0) {
      listEl.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--vb-muted); padding: 2rem;">Aucun verset ne correspond à votre recherche.</p>`;
      return;
    }

    filtered.forEach(verse => {
      const card = document.createElement('div');
      card.className = 'vb-biblio-item';
      card.innerHTML = `
        <div>
          <div class="vb-biblio-item-top">
            <span class="vb-biblio-ref">${verse.ref}</span>
            <span class="vb-badge vb-badge-soft">${verse.theme}</span>
          </div>
          <p class="vb-biblio-quote">« ${verse.text_lsg} »</p>
        </div>
        <div class="vb-biblio-actions">
          <button type="button" class="vb-btn vb-btn-primary vb-btn-sm btn-practice-verse">
            Graver ce verset ✍️
          </button>
        </div>
      `;

      card.querySelector('.btn-practice-verse').addEventListener('click', () => {
        loadVerse(verse);
        document.getElementById('tab-graver').click();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      });

      listEl.appendChild(card);
    });
  }

  // ==========================================================================
  // 10. Gestionnaires d'Événements
  // ==========================================================================
  function setupEventListeners() {
    // Thème toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Onglets principaux
    const tabs = document.querySelectorAll('.vb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.tabIndex = -1;
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;

        const targetPanelId = tab.getAttribute('aria-controls');
        document.querySelectorAll('.vb-panel').forEach(panel => {
          panel.classList.remove('active');
          panel.hidden = true;
        });
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
          targetPanel.classList.add('active');
          targetPanel.hidden = false;
        }
      });
    });

    // Filtres mode Graver
    const bookSel = document.getElementById('graver-book-select');
    const themeSel = document.getElementById('graver-theme-select');
    const verSel = document.getElementById('graver-version-select');
    const randBtn = document.getElementById('graver-random-btn');

    function applyVerseFilter() {
      const bVal = bookSel.value;
      const tVal = themeSel.value;
      const available = BIBLE_VERSES.filter(v => {
        const bOk = bVal === 'all' || v.book === bVal;
        const tOk = tVal === 'all' || v.theme === tVal;
        return bOk && tOk;
      });

      if (available.length > 0) {
        loadVerse(available[0]);
      } else {
        alert("Aucun verset dans cette combinaison. Réinitialisation des filtres.");
        bookSel.value = 'all';
        themeSel.value = 'all';
        loadVerse(BIBLE_VERSES[0]);
      }
    }

    if (bookSel) bookSel.addEventListener('change', applyVerseFilter);
    if (themeSel) themeSel.addEventListener('change', applyVerseFilter);
    if (verSel) {
      verSel.addEventListener('change', (e) => {
        state.currentVersion = e.target.value;
        loadVerse(state.currentVerse);
      });
    }

    if (randBtn) {
      randBtn.addEventListener('click', () => {
        const bVal = bookSel.value;
        const tVal = themeSel.value;
        const available = BIBLE_VERSES.filter(v => {
          const bOk = bVal === 'all' || v.book === bVal;
          const tOk = tVal === 'all' || v.theme === tVal;
          return bOk && tOk;
        });
        const pool = available.length > 0 ? available : BIBLE_VERSES;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        loadVerse(chosen);
      });
    }

    // Niveaux d'assistance
    const pills = document.querySelectorAll('.vb-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentAssist = pill.dataset.assist;
        updatePromptDisplay();
      });
    });

    // Zone de saisie
    const textarea = document.getElementById('practice-input');
    if (textarea) {
      textarea.addEventListener('input', updateCounters);
      // Raccourci Ctrl+Enter pour analyser rapidement
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          analyzeTyping();
        }
      });
    }

    // Actions typing
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeTyping);

    const clearBtn = document.getElementById('clear-input-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (textarea) {
          textarea.value = '';
          updateCounters();
          textarea.focus();
        }
      });
    }

    const showSolBtn = document.getElementById('show-solution-btn');
    if (showSolBtn) {
      showSolBtn.addEventListener('click', () => {
        const pillOpen = document.querySelector('.vb-pill[data-assist="open"]');
        if (pillOpen) pillOpen.click();
      });
    }

    // Audio & Copy
    const speakBtn = document.getElementById('audio-speak-btn');
    if (speakBtn) speakBtn.addEventListener('click', speakCurrentVerse);

    const copyBtn = document.getElementById('copy-ref-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const full = `${state.currentVerse.ref} : « ${getCanonicalText()} »`;
        navigator.clipboard.writeText(full).then(() => {
          const orig = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span>✓</span> Copié !';
          setTimeout(() => copyBtn.innerHTML = orig, 1800);
        });
      });
    }

    // Next verse / retry CTA
    const nextVBtn = document.getElementById('next-verse-btn');
    if (nextVBtn) {
      nextVBtn.addEventListener('click', () => {
        const curIdx = BIBLE_VERSES.findIndex(v => v.id === state.currentVerse.id);
        const nextIdx = (curIdx + 1) % BIBLE_VERSES.length;
        loadVerse(BIBLE_VERSES[nextIdx]);
        window.scrollTo({ top: 300, behavior: 'smooth' });
      });
    }

    const retryVBtn = document.getElementById('retry-verse-btn');
    if (retryVBtn) {
      retryVBtn.addEventListener('click', () => {
        loadVerse(state.currentVerse);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    }

    // Verset personnalisé
    const customToggleBtn = document.getElementById('graver-custom-toggle-btn');
    const customBox = document.getElementById('custom-verse-box');
    const customApplyBtn = document.getElementById('custom-apply-btn');
    const customCancelBtn = document.getElementById('custom-cancel-btn');

    if (customToggleBtn && customBox) {
      customToggleBtn.addEventListener('click', () => {
        customBox.hidden = !customBox.hidden;
      });
    }
    if (customCancelBtn && customBox) {
      customCancelBtn.addEventListener('click', () => {
        customBox.hidden = true;
      });
    }
    if (customApplyBtn) {
      customApplyBtn.addEventListener('click', () => {
        const refVal = document.getElementById('custom-ref-input')?.value.trim();
        const textVal = document.getElementById('custom-text-input')?.value.trim();
        if (!refVal || !textVal) {
          alert("Veuillez renseigner une référence et le texte exact.");
          return;
        }
        state.userCustomVerse = {
          id: 'custom',
          ref: refVal,
          book: refVal.split(' ')[0] || 'Personnalisé',
          theme: 'Personnalisé',
          text: textVal,
          text_lsg: textVal,
          text_pdv: textVal,
          context: 'Verset personnalisé ajouté manuellement.'
        };
        loadVerse(state.userCustomVerse);
        customBox.hidden = true;
      });
    }

    // Détective Mode Listeners
    const clueBtn = document.getElementById('detective-clue-btn');
    if (clueBtn) clueBtn.addEventListener('click', unlockDetectiveClue);

    const detectiveValBtn = document.getElementById('detective-validate-btn');
    if (detectiveValBtn) detectiveValBtn.addEventListener('click', validateDetectiveGuess);

    const detectiveGiveupBtn = document.getElementById('detective-giveup-btn');
    if (detectiveGiveupBtn) detectiveGiveupBtn.addEventListener('click', giveUpDetective);

    const detectiveNextBtn = document.getElementById('detective-next-btn');
    if (detectiveNextBtn) detectiveNextBtn.addEventListener('click', pickDetectiveVerse);

    // Direct input auto-detect on Enter
    const dirInp = document.getElementById('detective-direct-input');
    if (dirInp) {
      dirInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          validateDetectiveGuess();
        }
      });
    }

    // Flash Quiz Listeners
    const quizNextBtn = document.getElementById('quiz-next-btn');
    if (quizNextBtn) {
      quizNextBtn.addEventListener('click', () => {
        state.quizIndex++;
        renderQuizQuestion();
      });
    }

    const quizRestartBtn = document.getElementById('quiz-restart-btn');
    if (quizRestartBtn) quizRestartBtn.addEventListener('click', initQuiz);

    // Bibliothèque search
    const biblioSearch = document.getElementById('biblio-search');
    if (biblioSearch) {
      biblioSearch.addEventListener('input', (e) => {
        renderBiblioDirectory(e.target.value);
      });
    }
  }

  function setupKeyboardNavigation() {
    const tabList = document.querySelector('.vb-tabs-wrapper');
    if (!tabList) return;
    const tabs = Array.from(tabList.querySelectorAll('.vb-tab'));

    tabList.addEventListener('keydown', (e) => {
      const curIndex = tabs.indexOf(document.activeElement);
      if (curIndex === -1) return;

      let nextIndex = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (curIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (curIndex - 1 + tabs.length) % tabs.length;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Démarrage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
