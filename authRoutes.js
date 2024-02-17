//route de connexion à l'application
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const path = require('path');
const router = express.Router(); 
const session = require('express-session');
router.use(express.urlencoded({ extended: true }));

// Configurer la session
router.use(session({
  secret: 'adminpca&44000@nantes',
  resave: false,
  saveUninitialized: true,
}));

// Créer une connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'scenar&proc'
});

// Connecter à la base de données
connection.connect((err) => {
  if (err) throw err;
  console.log('Connecté à la base de données');
});

// Route pour connexion à l'application
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erreur du serveur');
    }

    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, isMatch) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Erreur du serveur');
        }

        if (isMatch) {
          // Si le mot de passe est correct, définir isAdmin dans la session et rediriger vers la page d'accueil
          req.session.isAdmin = result[0].isAdmin;
          res.redirect('accueil/accueil.html');
        } else {
          // Si le mot de passe est incorrect, renvoyer une erreur
          res.send('Mot de passe incorrect');
        }
      });
    } else {
      // Si l'utilisateur n'existe pas, renvoyer une erreur
      res.send('Nom d\'utilisateur non trouvé');
    }
  });
});

// vers la page d'accueil
router.get('/accueil', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/accueil/accueil.html'));
}); 

module.exports = router;