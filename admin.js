// Description: Route pour l'administration du site
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mysql = require('mysql');
const app = require('./app');

// Configurer multer pour stocker les fichiers sur le disque
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });

// Créer une connexion à la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'scenar&proc'
});

function queryPromise(query, params = []) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
// Route pour l'upload de fichiers
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).send('Vous devez être un administrateur pour uploader des fichiers.');
  }

  const file = req.file;
  const id_direction = req.body.direction;
  const id_profil = req.body.profil;
  const id_scenario = req.body.scenario;

  // Vérifiez le type de fichier
  const allowedMimetypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  if (!allowedMimetypes.includes(file.mimetype)) {
    return res.status(400).send('Type de fichier non autorisé. Seuls les fichiers PDF, Word, Excel et PowerPoint sont acceptés.');
  }

  // Insérez le fichier dans la base de données
  const query = 'INSERT INTO doc_proc (name, url, id_direction, id_profil, id_scenario) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [file.originalname, file.path, id_direction, id_profil, id_scenario], (err, result) => {
    if (err) throw err;

    res.redirect('liste_pdf/liste_pdf');
  });
});

// route organisation des fichiers dans tables 
router.get('/liste_pdf', (req, res) => {
  const queryDirections = 'SELECT * FROM liste_direction';
  const queryScenarios = 'SELECT * FROM liste_scenarios';
  const queryProfils = 'SELECT * FROM profil';

  Promise.all([
    queryPromise(queryDirections),
    queryPromise(queryScenarios),
    queryPromise(queryProfils)
  ]).then(([directions, scenarios, profils]) => {
    res.render('liste_pdf/liste_pdf', { directions, scenarios, profils });
  }).catch(err => {
    console.error(err);
    res.status(500).send('Erreur du serveur');
  });
});

module.exports = router;
