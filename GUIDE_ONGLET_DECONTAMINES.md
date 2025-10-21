# 📚 Guide d'utilisation - Onglet Décontaminés

## Vue d'ensemble

L'onglet **Décontaminés** permet de gérer automatiquement l'archivage des terrains qui ont été décontaminés et retirés du registre gouvernemental. Le système détecte automatiquement ces terrains et propose à l'administrateur de valider ou rejeter chaque détection.

---

## 🔍 Comment fonctionne la détection automatique ?

Le système analyse chaque terrain municipal selon **3 critères principaux** :

### Critère 1 : Avis de décontamination
- ✅ Le champ `avis_decontamination` contient une date

### Critère 2 : Retrait du registre gouvernemental
- ✅ Le terrain avait une référence MENVIQ (ex: X2059220)
- ✅ Cette référence n'existe plus dans le registre gouvernemental actuel

### Critère 3 : Mention dans les commentaires
- ✅ Le champ `commentaires` contient le mot "décontaminé"

---

## 📊 Niveaux de confiance

Le système attribue un **niveau de confiance** à chaque détection :

| Badge | Niveau | Critères requis |
|-------|--------|-----------------|
| 🟢 **Confirmé** | Haute confiance | Avis de décontamination **ET** Retrait du registre |
| 🟡 **Probable** | Confiance moyenne | Avis de décontamination **OU** (Retrait + Mention) |
| ⚪ **Présumé** | Faible confiance | Retrait du registre uniquement |

---

## ✅ Processus de validation

### Étape 1 : Consulter les terrains en attente

Au lancement de l'application, consultez l'onglet **Décontaminés**. Si des terrains ont été détectés automatiquement, vous verrez :

```
⚠️ Terrains en attente de validation
Ces terrains ont été détectés automatiquement comme potentiellement décontaminés.
Veuillez valider ou rejeter chaque terrain.
```

### Étape 2 : Examiner chaque terrain

Pour chaque terrain détecté, le tableau affiche :
- **Adresse** : Localisation du terrain
- **Lot** : Numéro de lot cadastral
- **Réf. MENVIQ** : Ancienne référence gouvernementale (si disponible)
- **Date décont.** : Date de l'avis de décontamination (si disponible)
- **Bureau** : Numéro du bureau de publicité
- **Statut** : Badge de confiance (🟢/🟡/⚪)
- **Critères** : Liste des critères de détection utilisés
- **Commentaires** : Notes municipales

### Étape 3 : Valider ou rejeter

Pour chaque terrain, cliquez sur :
- **✓ Valider** : Le terrain est archivé comme décontaminé
- **✗ Rejeter** : Le terrain n'est pas considéré comme décontaminé

Vos décisions sont **sauvegardées localement** et persistent entre les sessions.

---

## 🔄 Synchronisation des données gouvernementales

### Quand synchroniser ?

Synchronisez régulièrement pour :
- ✅ Détecter les nouveaux terrains décontaminés
- ✅ Mettre à jour le registre gouvernemental
- ✅ Recalculer les catégorisations

### Comment synchroniser ?

1. Allez dans l'onglet **🏛️ Registre gouvernemental**
2. Cliquez sur **🔄 Synchroniser les données**
3. Attendez la confirmation : "Données gouvernementales synchronisées avec succès!"

Le système va :
1. Recharger les données depuis le serveur (évite le cache)
2. Recatégoriser tous les terrains
3. Détecter automatiquement les nouveaux terrains décontaminés
4. Rafraîchir tous les tableaux et statistiques

---

## 🔍 Filtres avancés (Phase 2)

L'onglet **Décontaminés** dispose de filtres puissants :

### Filtre par adresse
- Recherche textuelle dans les adresses
- Exemple : "foreurs" trouvera "1185, rue des Foreurs"

### Filtre par année
- Sélection de l'année de décontamination
- Options : 2020, 2021, 2022, 2023, 2024, Toutes

### Filtre par statut
- 🟢 **Confirmé** : Haute confiance uniquement
- 🟡 **Probable** : Confiance moyenne uniquement
- ⚪ **Présumé** : Faible confiance uniquement
- **Tous** : Afficher tous les statuts

### Réinitialiser les filtres
Cliquez sur **🔄 Réinitialiser les filtres** pour effacer tous les critères.

---

## 📊 Statistiques annuelles (Phase 2)

Le système affiche automatiquement des **cartes de statistiques** montrant :
- Le nombre de terrains décontaminés **par année**
- Tri par ordre décroissant (années récentes en premier)
- Affichage dynamique selon vos données

Exemple :
```
📊 Statistiques annuelles

2024        2023        2022
  2           5           3
terrains   terrains   terrains
```

---

## 📋 Tableau des terrains validés

Le tableau principal affiche tous les terrains **décontaminés et validés** avec :

| Colonne | Description |
|---------|-------------|
| **Adresse** | Localisation complète du terrain |
| **Lot** | Numéro de lot cadastral |
| **Réf. MENVIQ** | Ancienne référence du registre gouvernemental |
| **Date décontamination** | Date de l'avis (format AAAA-MM-JJ) |
| **Bureau publicité** | Numéro pour consulter les documents officiels |
| **Statut** | Badge de confiance (🟢 Confirmé / 🟡 Probable / ⚪ Présumé) |
| **Critères de détection** | Liste des critères utilisés pour la détection |
| **Commentaires** | Notes municipales |

---

## 💾 Persistance des données

### Sauvegarde locale (localStorage)
Vos décisions de validation/rejet sont sauvegardées localement dans le navigateur :
- ✅ **Terrains validés** : Liste dans `validated_decontaminated`
- ❌ **Terrains rejetés** : Liste dans `rejected_decontaminated`

**Important** : Ces données sont locales à votre navigateur. Si vous videz le cache ou changez de navigateur, les décisions seront perdues.

### Données temporaires
Lorsque vous chargez des données municipales via **📤 Charger vos données municipales**, elles sont stockées temporairement dans `temp_municipal_data`.

---

## 📤 Export PDF

Cliquez sur **📄 Exporter en PDF** pour générer un document PDF contenant :
- La liste complète des terrains décontaminés validés
- Toutes les colonnes du tableau
- La date d'export
- Format : `Terrains_Decontamines_Archives_AAAA-MM-JJ.pdf`

---

## 🔔 Notifications

Le système affiche des notifications temporaires pour vous informer :
- ✅ **Succès** (vert) : Validation réussie, synchronisation réussie
- ℹ️ **Information** (bleu) : Terrain rejeté
- ⚠️ **Avertissement** (jaune) : Données temporaires chargées
- ❌ **Erreur** (rouge) : Erreur de chargement ou synchronisation

Les notifications disparaissent automatiquement après 3 secondes.

---

## 🎯 Bonnes pratiques

### 1. Synchronisation régulière
- Synchronisez **au moins une fois par mois** pour détecter les nouveaux terrains décontaminés
- Synchronisez **avant de générer des rapports officiels**

### 2. Validation rigoureuse
- **Examinez toujours** les critères de détection avant de valider
- **Vérifiez la date** de l'avis de décontamination si disponible
- **Consultez les commentaires** pour des informations complémentaires
- En cas de doute, **rejetez** plutôt que valider

### 3. Documentation
- **Ajoutez des commentaires** dans le registre municipal pour faciliter la détection future
- **Conservez les avis** de décontamination dans vos archives
- **Notez le bureau de publicité** pour retrouver les documents officiels

### 4. Export et archivage
- **Exportez régulièrement** en PDF pour vos archives
- **Conservez les versions** antérieures pour historique
- **Incluez la date** dans le nom du fichier

---

## ❓ Questions fréquentes

### Q1 : Pourquoi un terrain est-il détecté avec un statut "Présumé" ?
**R** : Le terrain avait une référence MENVIQ qui n'existe plus dans le registre gouvernemental, mais il n'y a pas d'avis de décontamination ni de mention explicite. Vérifiez manuellement avant de valider.

### Q2 : Puis-je modifier mes décisions de validation ?
**R** : Oui ! Si vous avez validé un terrain par erreur, rechargez simplement la page et rejetez-le. Si vous l'avez rejeté, vous pouvez le valider lors de la prochaine détection.

### Q3 : Que se passe-t-il si je vide le cache de mon navigateur ?
**R** : Toutes vos décisions de validation/rejet seront perdues. Le système refera la détection automatique au prochain chargement.

### Q4 : Les terrains validés apparaissent-ils toujours dans "Données municipales" ?
**R** : Oui, les terrains décontaminés restent dans le registre municipal pour historique. Ils apparaissent simplement aussi dans l'onglet "Décontaminés".

### Q5 : Comment savoir si un terrain a vraiment été décontaminé ?
**R** : Vérifiez :
- L'avis de décontamination dans vos dossiers
- La disparition de la référence du registre gouvernemental
- Les documents au bureau de publicité
- Les rapports de suivi environnemental

---

## 🆘 Support

En cas de problème :
1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Essayez de synchroniser les données
3. Rechargez la page (Ctrl+F5)
4. Videz le cache si nécessaire

---

## 🎉 Résumé

L'onglet **Décontaminés** offre :
- ✅ Détection automatique intelligente avec 3 critères
- ✅ Validation manuelle avec badges de confiance
- ✅ Synchronisation des données en un clic
- ✅ Filtres avancés (adresse, année, statut)
- ✅ Statistiques annuelles dynamiques
- ✅ Export PDF pour archivage
- ✅ Traçabilité complète des décisions

**Gagnez du temps** en automatisant la détection tout en gardant le **contrôle total** avec la validation manuelle !

---

**Dernière mise à jour** : 2025-10-21
**Version** : 1.0 (Phases 1 & 2)
