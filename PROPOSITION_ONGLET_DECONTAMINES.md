# 📋 Proposition pour l'Onglet "Décontaminés"

## 🎯 Objectif

L'onglet "Décontaminés" doit servir d'**archive permanente** des terrains qui ont été assainis et ne figurent plus dans le registre gouvernemental actif.

---

## 💡 Proposition de Fonctionnalités

### 1. **Identification Automatique des Terrains Décontaminés**

#### Critères de Détection :
```javascript
Un terrain est considéré comme décontaminé SI :
✅ Il a une date d'avis de décontamination (champ "avis_decontamination")
OU
✅ Il était dans les données municipales mais n'est plus dans le registre gouvernemental
   ET a un commentaire indiquant "décontaminé"
```

#### Données à Afficher :
```
📍 Adresse complète
📝 Numéro de lot cadastral
🔢 Ancienne référence MENVIQ (pour traçabilité)
📅 Date de l'avis de décontamination
📄 Numéro d'inscription au bureau de la publicité des droits
💬 Commentaires/Notes
📊 Historique (optionnel)
```

---

### 2. **Interface Proposée**

#### A. Message Informatif en Haut
```markdown
✅ Archive des Terrains Décontaminés

Ces terrains ont fait l'objet d'une décontamination et ne figurent plus 
dans le registre actif du gouvernement. Cette archive est conservée à 
des fins de traçabilité et d'historique.

📊 Total : [X] terrains décontaminés archivés
📅 Dernière mise à jour : [Date]
```

#### B. Filtres Spécifiques
```
- Filtrer par adresse
- Filtrer par période de décontamination (année)
- Filtrer par lot cadastral
- Recherche globale
```

#### C. Tableau des Données
```
| Adresse | Lot | Ancienne Réf. | Date Décontamination | Bureau Publicité | Statut | Commentaires |
```

#### D. Badge de Statut
Chaque ligne pourrait avoir un badge :
- 🟢 **Confirmé** : Décontamination confirmée par avis officiel
- 🟡 **Présumé** : Absent du registre gouvernemental sans avis formel
- 🔵 **Archivé** : Ancien terrain, historique complet

---

### 3. **Sources de Données**

#### Option A : Données Municipales avec Avis
```javascript
// Dans load_municipal_data.py ou via l'interface
{
  "adresse": "123, rue Exemple",
  "lot": "1234567",
  "reference": "7610-08-01-XXXXX-XX",
  "avis_decontamination": "2023-05-15",  // ✅ DATE PRÉSENTE
  "bureau_publicite": "12345678",
  "commentaires": "Décontaminé suite à l'avis du MELCCFP"
}
```

#### Option B : Comparaison Historique
```javascript
// Logique dans app.js
1. Charger historique des données municipales (si disponible)
2. Comparer avec le registre gouvernemental actuel
3. Identifier les terrains qui ont "disparu" du registre
4. Vérifier s'ils ont un avis de décontamination
5. Les déplacer vers l'onglet "Décontaminés"
```

---

### 4. **Implémentation Technique**

#### Modification de `src/app.js`

```javascript
/**
 * Identifier et catégoriser les terrains décontaminés
 */
function identifyDecontaminatedLands() {
    decontaminatedData = municipalData.filter(item => {
        // Critère 1 : A une date d'avis de décontamination
        const hasDecontaminationNotice = item.avis_decontamination && 
                                        item.avis_decontamination.trim() !== '';
        
        // Critère 2 : Commentaire mentionne "décontaminé"
        const hasDecontaminationComment = item.commentaires && 
                                         item.commentaires.toLowerCase().includes('décontaminé');
        
        // Critère 3 : Avait une référence mais n'est plus dans le registre gouvernemental
        const hadReference = item.reference && item.reference.trim() !== '';
        const notInGovernmentRegistry = hadReference && 
                                       !governmentData.some(gov => 
                                           gov.NO_MEF_LIEU === item.reference
                                       );
        
        return hasDecontaminationNotice || 
               (notInGovernmentRegistry && hasDecontaminationComment);
    });
    
    // Trier par date de décontamination (plus récent en premier)
    decontaminatedData.sort((a, b) => {
        const dateA = new Date(a.avis_decontamination || '1900-01-01');
        const dateB = new Date(b.avis_decontamination || '1900-01-01');
        return dateB - dateA;
    });
    
    console.log(`✅ ${decontaminatedData.length} terrains décontaminés identifiés`);
}

/**
 * Afficher les terrains décontaminés avec informations enrichies
 */
function displayDecontaminatedData(table, data) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'text-center text-muted';
        cell.innerHTML = `
            <div class="py-4">
                <p class="mb-2">📂 Aucun terrain décontaminé archivé</p>
                <small>Les terrains avec avis de décontamination apparaîtront ici</small>
            </div>
        `;
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Badge de statut
        const hasNotice = item.avis_decontamination && item.avis_decontamination !== '';
        const statusBadge = hasNotice 
            ? '<span class="badge bg-success">🟢 Confirmé</span>'
            : '<span class="badge bg-warning">🟡 Présumé</span>';
        
        // Formatage de la date
        const decontaminationDate = item.avis_decontamination 
            ? new Date(item.avis_decontamination).toLocaleDateString('fr-CA')
            : 'Non spécifiée';
        
        const columns = [
            item.adresse || '',
            item.lot || '',
            item.reference || 'N/A',
            decontaminationDate,
            item.bureau_publicite || '',
            statusBadge,
            item.commentaires || ''
        ];
        
        columns.forEach((value, colIndex) => {
            const cell = document.createElement('td');
            if (colIndex === 5) {
                // Colonne statut : insérer HTML
                cell.innerHTML = value;
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}
```

#### Modification de `index.html`

```html
<!-- Onglet Décontaminés -->
<div class="tab-pane fade" id="decontaminated" role="tabpanel">
    <div class="alert alert-success" role="alert">
        <h5>✅ Archive des Terrains Décontaminés</h5>
        <p class="mb-0">
            Ces terrains ont fait l'objet d'une décontamination et ne figurent plus 
            dans le registre actif du gouvernement. Cette archive est conservée à 
            des fins de traçabilité et d'historique.
        </p>
        <hr>
        <p class="mb-0">
            <strong>📊 Total :</strong> <span id="decontaminated-count">0</span> terrains décontaminés
        </p>
    </div>
    
    <!-- Filtres -->
    <div class="filter-section">
        <h5>Filtres</h5>
        <div class="row">
            <div class="col-md-3">
                <input type="text" id="decontaminated-address-filter" 
                       class="form-control" placeholder="Filtrer par adresse">
            </div>
            <div class="col-md-3">
                <input type="text" id="decontaminated-year-filter" 
                       class="form-control" placeholder="Année de décontamination">
            </div>
            <div class="col-md-3">
                <input type="text" id="decontaminated-lot-filter" 
                       class="form-control" placeholder="Filtrer par lot">
            </div>
            <div class="col-md-3">
                <input type="text" id="decontaminated-search" 
                       class="form-control" placeholder="Recherche globale">
            </div>
        </div>
    </div>
    
    <button id="export-pdf-decontaminated" class="btn btn-primary btn-export">
        📄 Exporter en PDF
    </button>
    
    <div class="table-responsive">
        <table class="table table-striped table-hover" id="decontaminated-table">
            <thead class="table-dark">
                <tr>
                    <th>Adresse</th>
                    <th>Lot</th>
                    <th>Ancienne Réf. MENVIQ</th>
                    <th>Date Décontamination</th>
                    <th>Bureau Publicité</th>
                    <th>Statut</th>
                    <th>Commentaires</th>
                </tr>
            </thead>
            <tbody id="decontaminated-tbody">
                <!-- Les données seront insérées ici par JavaScript -->
            </tbody>
        </table>
    </div>
</div>
```

---

### 5. **Fonctionnalités Avancées (Optionnelles)**

#### A. Historique Détaillé
```javascript
// Ajouter un bouton "Voir historique" sur chaque ligne
// Au clic, afficher un modal avec :
- Timeline de la contamination à la décontamination
- Documents associés (si disponibles)
- Photos avant/après (si disponibles)
```

#### B. Export Spécialisé
```javascript
// Export PDF avec :
- En-tête spécifique "Archive des Terrains Décontaminés"
- Statistiques par année
- Graphique d'évolution (si plusieurs années)
```

#### C. Recherche Avancée
```javascript
// Recherche par :
- Plage de dates
- Type de contamination initiale
- Méthode de décontamination
```

---

### 6. **Gestion des Données**

#### Format du Fichier CSV Municipal
```csv
adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
"123, rue Exemple","1234567","7610-08-01-12345-06","2023-05-15","12345678","Décontaminé suite à avis MELCCFP"
"456, avenue Test","7654321","7610-08-01-67890-08","2022-11-20","87654321","Réhabilitation complétée, usage résidentiel autorisé"
```

#### Validation des Données
```javascript
// S'assurer que :
1. La date d'avis est au format valide (YYYY-MM-DD)
2. Le numéro de bureau de publicité existe si la décontamination est confirmée
3. Les commentaires sont présents pour justifier l'archivage
```

---

### 7. **Interface Utilisateur - Wireframe**

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Archive des Terrains Décontaminés                        │
│                                                               │
│ Ces terrains ont fait l'objet d'une décontamination...      │
│ 📊 Total : 12 terrains décontaminés                         │
├─────────────────────────────────────────────────────────────┤
│ Filtres:                                                     │
│ [Adresse...] [Année...] [Lot...] [Recherche...]            │
│                                                               │
│ [📄 Exporter en PDF]                                         │
├──────┬─────┬──────────┬──────────┬─────────┬────────┬──────┤
│Adr.  │ Lot │ Anc.Réf. │   Date   │ Bureau  │ Statut │ Comm.│
├──────┼─────┼──────────┼──────────┼─────────┼────────┼──────┤
│123,  │12345│7610-...  │2023-05-15│12345678 │🟢 Conf.│Décon.│
│rue E.│67   │          │          │         │        │suit..│
├──────┼─────┼──────────┼──────────┼─────────┼────────┼──────┤
│456,  │76543│N/A       │2022-11-20│87654321 │🟢 Conf.│Réhab.│
│ave T.│21   │          │          │         │        │compl.│
└──────┴─────┴──────────┴──────────┴─────────┴────────┴──────┘
```

---

## 🎯 Recommandation Finale

**Je recommande l'approche suivante :**

### Phase 1 : Implémentation de Base (Immédiate)
1. ✅ Détection automatique basée sur `avis_decontamination`
2. ✅ Affichage dans un tableau avec badge de statut
3. ✅ Filtres de base (adresse, lot, année)
4. ✅ Export PDF

### Phase 2 : Enrichissement (Court terme)
1. 🔄 Comparaison avec historique des données
2. 🔄 Recherche avancée
3. 🔄 Statistiques par année

### Phase 3 : Fonctionnalités Avancées (Long terme)
1. 📅 Timeline interactive
2. 📎 Pièces jointes (documents, photos)
3. 📊 Graphiques d'évolution

---

## 💬 Questions à Considérer

1. **Voulez-vous conserver un historique des anciennes versions du registre ?**
   - Si oui, il faudra stocker les anciennes données gouvernementales

2. **Les avis de décontamination sont-ils toujours disponibles ?**
   - Important pour la traçabilité légale

3. **Devrait-on archiver automatiquement ou manuellement ?**
   - Automatique : Basé sur la date d'avis
   - Manuelle : L'utilisateur confirme l'archivage

4. **Faut-il une validation avant archivage ?**
   - Workflow d'approbation ?
   - Double vérification ?

---

**Quelle approche préférez-vous ? Je peux implémenter la solution choisie immédiatement.** 🚀
