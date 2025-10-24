#!/usr/bin/env python3
"""
Script pour convertir le registre municipal Excel en format CSV pour Firebase
"""

import pandas as pd
import sys

def clean_text(text):
    """Nettoyer le texte des caractères spéciaux"""
    if pd.isna(text) or text == '':
        return ''
    return str(text).replace('\r', '').replace('\n', ' ').strip()

def convert_municipal_register(excel_file, output_csv):
    """
    Convertir le registre municipal Excel en format CSV
    """
    print(f"📖 Lecture du fichier Excel: {excel_file}")
    
    # Lire le fichier Excel
    df = pd.read_excel(excel_file)
    
    print(f"✅ {len(df)} lignes trouvées")
    print(f"📋 Colonnes disponibles: {', '.join(df.columns)}")
    
    # Filtrer les lignes vides (où toutes les colonnes sont vides)
    df = df.dropna(how='all')
    
    # Créer le DataFrame municipal avec les colonnes requises
    municipal_data = pd.DataFrame()
    
    # Colonne 1: adresse
    municipal_data['adresse'] = df['Adresse'].apply(clean_text)
    
    # Colonne 2: lot
    municipal_data['lot'] = df['Numéro de lot'].apply(clean_text)
    
    # Colonne 3: reference
    municipal_data['reference'] = df['Référence MENVIQ'].apply(clean_text)
    
    # Colonne 4: avis_decontamination
    municipal_data['avis_decontamination'] = df['Avis de décontamination'].apply(clean_text)
    
    # Colonne 5: bureau_publicite
    municipal_data['bureau_publicite'] = df['Bureau publicité des droits'].apply(clean_text)
    
    # Colonne 6: commentaires
    municipal_data['commentaires'] = df['Commentaires'].apply(clean_text)
    
    # Filtrer les lignes où l'adresse est vide (lignes de continuation de lots)
    # On va les fusionner avec la ligne précédente
    cleaned_data = []
    current_record = None
    
    for idx, row in municipal_data.iterrows():
        if row['adresse'] != '':
            # Nouvelle adresse, sauvegarder l'ancienne si elle existe
            if current_record is not None:
                cleaned_data.append(current_record)
            # Commencer un nouveau record
            current_record = row.to_dict()
        else:
            # Ligne de continuation (lot supplémentaire ou commentaire)
            if current_record is not None:
                # Ajouter le lot supplémentaire
                if row['lot'] != '':
                    if current_record['lot'] != '':
                        current_record['lot'] += ', ' + row['lot']
                    else:
                        current_record['lot'] = row['lot']
                
                # Ajouter les commentaires supplémentaires
                if row['commentaires'] != '':
                    if current_record['commentaires'] != '':
                        current_record['commentaires'] += ' | ' + row['commentaires']
                    else:
                        current_record['commentaires'] = row['commentaires']
    
    # Ajouter le dernier record
    if current_record is not None:
        cleaned_data.append(current_record)
    
    # Créer le DataFrame final
    final_data = pd.DataFrame(cleaned_data)
    
    # Sauvegarder en CSV
    print(f"\n💾 Sauvegarde dans: {output_csv}")
    final_data.to_csv(output_csv, index=False, encoding='utf-8')
    
    print(f"✅ Fichier CSV créé avec succès!")
    print(f"\n📊 Statistiques:")
    print(f"   - Total d'enregistrements: {len(final_data)}")
    print(f"   - Avec adresse: {(final_data['adresse'] != '').sum()}")
    print(f"   - Avec lot: {(final_data['lot'] != '').sum()}")
    print(f"   - Avec référence: {(final_data['reference'] != '').sum()}")
    print(f"   - Avec avis décontamination: {(final_data['avis_decontamination'] != '').sum()}")
    print(f"   - Avec bureau publicité: {(final_data['bureau_publicite'] != '').sum()}")
    print(f"   - Avec commentaires: {(final_data['commentaires'] != '').sum()}")
    
    # Afficher un aperçu
    print(f"\n👀 Aperçu des 5 premiers enregistrements:")
    print(final_data.head().to_string())
    
    return final_data

if __name__ == '__main__':
    excel_file = 'Registre des terrains contamines.xls'
    output_csv = 'donnees-municipales-valdor.csv'
    
    try:
        convert_municipal_register(excel_file, output_csv)
        print(f"\n✅ Conversion terminée!")
        print(f"\n📋 Prochaines étapes:")
        print(f"   1. Vérifier le fichier {output_csv}")
        print(f"   2. Charger le fichier dans upload-data.html")
        print(f"   3. Vérifier l'aperçu et charger dans Firebase")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)