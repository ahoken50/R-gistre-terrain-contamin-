# Registre automatisé des terrains contaminés – Ville de Val-d'Or

Automatisation du registre municipal fondé sur le répertoire GTC ministériel.  
**Exporte un Excel harmonisé chaque exécution.**

## Déploiement local
Installe les dépendances, puis lance le script :

pip install -r requirements.txt
python automate_registre_valdor.py


---

## 2. Déploiement automatique sur GitHub Actions

Le workflow dans `.github/workflows/auto-weekly.yml` lance le script chaque vendredi matin dans le cloud via GitHub Actions.

---

## 3. Personnalisation

Pour cibler une autre ville que Val-d'Or, modifiez la variable `CITY_FILTER` en haut du script `automate_registre_valdor.py` :

CITY_FILTER = "VAL-D'OR"
---

## 4. Sortie

Le fichier `Registre-des-terrains-contamines-Valdor.xlsx` est généré automatiquement.
