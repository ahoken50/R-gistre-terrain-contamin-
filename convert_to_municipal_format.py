#!/usr/bin/env python3
"""
Script pour convertir le fichier Excel gouvernemental en format municipal
avec toutes les colonnes requises remplies.
"""

import pandas as pd
import sys

def convert_to_municipal_format(excel_file, output_csv):
    """
    Convertir le fichier Excel en format municipal CSV
    """
    print(f"📖 Lecture du fichier Excel: {excel_file}")
    
    # Lire le fichier Excel
    df = pd.read_excel(excel_file)
    
    print(f"✅ {len(df)} enregistrements trouvés")
    print(f"📋 Colonnes disponibles: {', '.join(df.columns)}")
    
    # Créer le DataFrame municipal avec les colonnes requises
    municipal_data = pd.DataFrame()
    
    # Colonne 1: adresse (depuis ADR_CIV_LIEU)
    municipal_data['adresse'] = df['ADR_CIV_LIEU'].fillna('')
    
    # Colonne 2: lot (vide pour l'instant, à remplir manuellement si disponible)
    municipal_data['lot'] = ''
    
    # Colonne 3: reference (depuis NO_MEF_LIEU)
    municipal_data['reference'] = df['NO_MEF_LIEU'].fillna('')
    
    # Colonne 4: avis_decontamination (basé sur ETAT_REHAB)
    def get_avis_decontamination(etat):
        if pd.isna(etat) or etat == '':
            return ''
        etat_str = str(etat).lower()
        if 'terminée' in etat_str:
            return 'Décontamination terminée'
        elif 'initiée' in etat_str:
            return 'Décontamination en cours'
        elif 'non débutée' in etat_str:
            return 'Décontamination requise'
        elif 'non nécessaire' in etat_str:
            return 'Décontamination non nécessaire'
        else:
            return etat
    
    municipal_data['avis_decontamination'] = df['ETAT_REHAB'].apply(get_avis_decontamination)
    
    # Colonne 5: bureau_publicite (vide pour l'instant, à remplir manuellement)
    municipal_data['bureau_publicite'] = ''
    
    # Colonne 6: commentaires (combinaison de plusieurs champs)
    def create_comments(row):
        comments = []
        
        # Ajouter le numéro de référence
        if pd.notna(row['NO_MEF_LIEU']) and row['NO_MEF_LIEU'] != '':
            comments.append(f"Réf. gouv: {row['NO_MEF_LIEU']}")
        
        # Ajouter l'état de réhabilitation
        if pd.notna(row['ETAT_REHAB']) and row['ETAT_REHAB'] != '':
            comments.append(f"État: {row['ETAT_REHAB']}")
        
        # Ajouter les contaminants du sol si présents
        if pd.notna(row['CONTAM_SOL_EXTRA']) and row['CONTAM_SOL_EXTRA'] != '':
            contaminants = str(row['CONTAM_SOL_EXTRA']).replace('\n', ', ')
            if len(contaminants) > 100:
                contaminants = contaminants[:100] + '...'
            comments.append(f"Contaminants: {contaminants}")
        
        # Ajouter la qualité des sols
        if pd.notna(row['QUAL_SOLS']) and row['QUAL_SOLS'] != '':
            comments.append(f"Qualité sols: {row['QUAL_SOLS']}")
        
        return ' | '.join(comments) if comments else ''
    
    municipal_data['commentaires'] = df.apply(create_comments, axis=1)
    
    # Nettoyer les adresses (enlever les retours de ligne et caractères spéciaux)
    municipal_data['adresse'] = municipal_data['adresse'].str.replace('\r', '').str.replace('\n', ', ').str.strip()
    
    # Nettoyer les commentaires aussi
    municipal_data['commentaires'] = municipal_data['commentaires'].str.replace('\r', '').str.replace('\n', ', ')
    
    # Sauvegarder en CSV
    print(f"\n💾 Sauvegarde dans: {output_csv}")
    municipal_data.to_csv(output_csv, index=False, encoding='utf-8')
    
    print(f"✅ Fichier CSV créé avec succès!")
    print(f"\n📊 Statistiques:")
    print(f"   - Total d'enregistrements: {len(municipal_data)}")
    print(f"   - Avec avis de décontamination: {(municipal_data['avis_decontamination'] != '').sum()}")
    print(f"   - Avec commentaires: {(municipal_data['commentaires'] != '').sum()}")
    
    # Afficher un aperçu
    print(f"\n👀 Aperçu des 5 premiers enregistrements:")
    print(municipal_data.head().to_string())
    
    return municipal_data

if __name__ == '__main__':
    excel_file = 'Registre-des-terrains-contamines-Valdor.xlsx'
    output_csv = 'donnees-municipales-completes.csv'
    
    try:
        convert_to_municipal_format(excel_file, output_csv)
        print(f"\n✅ Conversion terminée!")
        print(f"\n📋 Prochaines étapes:")
        print(f"   1. Ouvrir {output_csv} dans Excel")
        print(f"   2. Remplir les colonnes 'lot' et 'bureau_publicite' si vous avez ces informations")
        print(f"   3. Charger le fichier dans upload-data.html")
        print(f"   4. Vérifier l'aperçu et charger dans Firebase")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        sys.exit(1)