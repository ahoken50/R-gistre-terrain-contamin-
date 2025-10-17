#!/usr/bin/env python3
"""
Script pour convertir le fichier Excel des terrains contaminés de Val-d'Or en JSON
pour l'application web
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# Chemins des fichiers
EXCEL_PATH = "Registre-des-terrains-contamines-Valdor.xlsx"
JSON_OUTPUT = "public/data/government-data.json"

def convert_excel_to_json():
    """
    Convertit le fichier Excel en JSON pour l'application web
    """
    try:
        # Vérifier si le fichier Excel existe
        if not Path(EXCEL_PATH).exists():
            print(f"❌ Fichier {EXCEL_PATH} introuvable.")
            print("Veuillez d'abord exécuter le script automate_registre_valdor.py")
            return False
        
        # Charger le fichier Excel
        print(f"📊 Chargement de {EXCEL_PATH}...")
        df = pd.read_excel(EXCEL_PATH)
        
        print(f"✅ Fichier chargé : {len(df)} enregistrements trouvés")
        
        # Afficher les colonnes disponibles
        print("\n📋 Colonnes disponibles :")
        for col in df.columns:
            print(f"  - {col}")
        
        # Convertir les dates en format ISO si présentes
        date_columns = ['Date création', 'Date MAJ']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
        
        # Remplacer les NaN par des chaînes vides
        df = df.fillna('')
        
        # Convertir en dictionnaire
        data = df.to_dict(orient='records')
        
        # Créer le dossier de sortie si nécessaire
        Path(JSON_OUTPUT).parent.mkdir(parents=True, exist_ok=True)
        
        # Sauvegarder en JSON
        with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
            json.dump({
                'data': data,
                'metadata': {
                    'source': 'Registre des terrains contaminés - Gouvernement du Québec',
                    'city': 'Val-d\'Or',
                    'total_records': len(data),
                    'last_update': datetime.now().isoformat(),
                    'generated_by': 'convert_excel_to_json.py'
                }
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Conversion réussie !")
        print(f"📁 Fichier JSON créé : {JSON_OUTPUT}")
        print(f"📊 {len(data)} enregistrements exportés")
        
        # Afficher un aperçu des premières données
        if len(data) > 0:
            print("\n📄 Aperçu des données (premier enregistrement) :")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la conversion : {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("="*60)
    print("🔄 Conversion Excel → JSON pour l'application web")
    print("="*60)
    print()
    
    success = convert_excel_to_json()
    
    if success:
        print("\n" + "="*60)
        print("✅ Conversion terminée avec succès !")
        print("="*60)
        print("\n💡 Prochaines étapes :")
        print("1. Commitez le fichier JSON généré")
        print("2. Poussez vers GitHub")
        print("3. L'application chargera automatiquement les données")
    else:
        print("\n" + "="*60)
        print("❌ La conversion a échoué")
        print("="*60)
        print("\n💡 Vérifiez :")
        print("1. Que le fichier Excel existe")
        print("2. Que le format du fichier est correct")
        print("3. Les messages d'erreur ci-dessus")
