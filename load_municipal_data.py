#!/usr/bin/env python3
"""
Script pour charger les données municipales depuis un fichier CSV et les convertir en JSON
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# Chemins des fichiers
CSV_INPUT = "donnees-municipales.csv"  # Créez ce fichier avec vos données
CSV_TEMPLATE = "template-donnees-municipales.csv"
JSON_OUTPUT = "public/data/municipal-data.json"

def load_municipal_data():
    """
    Charge les données municipales depuis CSV et les convertit en JSON
    """
    try:
        # Vérifier quel fichier utiliser
        csv_file = CSV_INPUT if Path(CSV_INPUT).exists() else CSV_TEMPLATE
        
        if not Path(csv_file).exists():
            print(f"❌ Aucun fichier de données municipales trouvé.")
            print(f"Créez un fichier '{CSV_INPUT}' avec vos données municipales.")
            print(f"Utilisez '{CSV_TEMPLATE}' comme modèle.")
            return False
        
        print(f"📊 Chargement de {csv_file}...")
        df = pd.read_csv(csv_file, encoding='utf-8')
        
        print(f"✅ Fichier chargé : {len(df)} enregistrements trouvés")
        
        # Afficher les colonnes
        print("\n📋 Colonnes disponibles :")
        for col in df.columns:
            print(f"  - {col}")
        
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
                    'source': 'Registre municipal - Ville de Val-d\'Or',
                    'total_records': len(data),
                    'last_update': datetime.now().isoformat(),
                    'generated_by': 'load_municipal_data.py'
                }
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Conversion réussie !")
        print(f"📁 Fichier JSON créé : {JSON_OUTPUT}")
        print(f"📊 {len(data)} enregistrements exportés")
        
        # Aperçu
        if len(data) > 0:
            print("\n📄 Aperçu (premier enregistrement) :")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du chargement : {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("="*60)
    print("🔄 Chargement des données municipales CSV → JSON")
    print("="*60)
    print()
    
    success = load_municipal_data()
    
    if success:
        print("\n" + "="*60)
        print("✅ Chargement terminé avec succès !")
        print("="*60)
        print("\n💡 Prochaines étapes :")
        print("1. Vérifiez le fichier JSON généré")
        print("2. Mettez à jour vos données municipales dans le CSV")
        print("3. Relancez ce script pour régénérer le JSON")
        print("4. Commitez et poussez vers GitHub")
    else:
        print("\n" + "="*60)
        print("❌ Le chargement a échoué")
        print("="*60)
