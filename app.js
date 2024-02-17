//Déclaration des modules
const express = require('express');
const app = express(); 
const mysql = require('mysql');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session'); 
const authRoutes = require('./authRoutes');
const { db } = require('./admin');
const fs = require('fs');
const multer = require('multer');
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
const admin = require('./admin');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('scenar&proc', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});
const { DocProc, scenario,Profil} = require('./doc_proc');
async function fetchFiles() {
  const files = await DocProc.findAll({
    include: [{
      model: scenario, 
      as: 'scenario'
    }, {
      model: Profil,
      as: 'profil'
    }]
  });

  return files;
}
i18next
  .use(FsBackend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, 
    },
    backend: {
      loadPath: './public/en.json',
    },
  });

 
// Création de la connexion à la base de données
app.use('/public', express.static('public'));
app.use(authRoutes);
app.use(admin);
app.use(passport.initialize());
app.use('/liste_pdf', admin);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'scenar&proc'
});

// route vers la page d'accueil
app.get('/confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/confirmation.html'));
});

app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

//requête pour l'inscription
app.post('/inscription', async (req, res) => {
  const form_email = req.body.email;
  const form_username = req.body.username;
  const form_password = req.body.password;
  const form_confirmPassword = req.body.confirmPassword;
  const isAdmin = req.body.isAdmin;
 
  
  if (form_password !== form_confirmPassword) {
    return res.status(400).send('Les mots de passe ne correspondent pas.');
  }
  
  let password = form_password;
  let saltRounds = 10;
  
  // Hachage du mot de passe
  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Erreur lors du hachage du mot de passe : ', err);
      return res.status(500).send(err);
    }
    // Stockage des infos uti dans la base de données
    const query = 'INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)';
    connection.query(query, [form_username, form_email, hash, isAdmin], (error, results) => {
      if (error) {
        console.error('Erreur lors de l\'insertion : ', error);
        return res.status(500).send(error);
      }
      req.session.isAdmin = isAdmin; 
      res.redirect('/confirmation');
    });
  });
});

//requête pour la tables des documents 
app.get('/files', (req, res) => {
  const query = `
    SELECT 
    doc_proc.*, 
    liste_direction.nom AS direction_nom, 
    liste_scenarios.nom AS scenario_nom, 
    profil.nom AS profil_nom 
    FROM doc_proc 
    JOIN liste_direction ON doc_proc.id_direction = liste_direction.id_direction 
    JOIN liste_scenarios ON doc_proc.id_scenario = liste_scenarios.id_scenario 
    JOIN profil ON doc_proc.id_profil = profil.id_profil 
    ORDER BY liste_direction.nom
  `;
  connection.query(query, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erreur du serveur');
    }
    let filesByDirection = {};
    files.forEach(file => {
      if (!filesByDirection[file.direction_nom]) {
        filesByDirection[file.direction_nom] = [];
      }
      filesByDirection[file.direction_nom].push(file);
    });
  
    // Passer filesByDirection à la vue
    res.render('files', { filesByDirection: filesByDirection });
  });
})
function createFilesByProfileAndScenario(files) {
  const filesByProfileAndScenario = {};
  files.forEach(file => {
    const profile = file.id_profil; // Récupère l'id_profil du fichier
    const scenario = file.id_scenario; // Récupère l'id_scenario du fichier
    // Si filesByProfileAndScenario n'a pas encore de clé pour ce profil, créez un nouvel objet vide pour cette clé
    if (!filesByProfileAndScenario[profile]) {
      filesByProfileAndScenario[profile] = {};
    }
    // Si l'objet pour ce profil n'a pas encore de clé pour ce scénario, créez un nouveau tableau vide pour cette clé
    if (!filesByProfileAndScenario[profile][scenario]) {
      filesByProfileAndScenario[profile][scenario] = [];
    }
    // Ajoute le fichier au tableau pour ce profil et ce scénario
    filesByProfileAndScenario[profile][scenario].push(file);
  });
  return filesByProfileAndScenario;
}

app.post('/search', async (req, res) => {
  try {
    console.log("Received POST request to /search with body: ", req.body);
    const id_profil = parseInt(req.body.id_profil, 10);
    const id_scenario = parseInt(req.body.id_scenario, 10);
    if (isNaN(id_profil) || isNaN(id_scenario)) {
      return res.status(400).send('id_profil et id_scenario doivent être des nombres');
    }
    const filteredFiles = await DocProc.findAll({
      where: {
        id_profil: id_profil,
        id_scenario: id_scenario
      },
      include: [{ model: scenario, as: 'scenario' }, { model: Profil, as: 'profil' }]
    });
    const filesByProfileAndScenario = createFilesByProfileAndScenario(filteredFiles); 
    // Utilisez la même logique que dans la route GET /files pour obtenir les fichiers triés par direction
    let filesByDirection = {};
  filteredFiles.forEach(file => {
  let direction = req.path === '/search' ? 'Fichiers filtrés' : file.direction_nom;
  if (!filesByDirection[direction]) {
    filesByDirection[direction] = [];
  }
  // Ajoutez les valeurs de profil et de scénario à l'objet file
  file.profil_nom = file.profil_nom ? file.profil_nom : '';
  file.scenario_nom = file.scenario_nom ? file.scenario_nom : '';
  filesByDirection[direction].push(file);
});
    console.log("Fetched files by direction: ", filesByDirection);
    res.render('files', { filteredFiles: filteredFiles, filesByProfileAndScenario: filesByProfileAndScenario, filesByDirection: filesByDirection });
  } catch (error) {
    console.error("An error occurred: ", error);
    res.status(500).send('Une erreur s\'est produite');
  }
});

module.exports = app;