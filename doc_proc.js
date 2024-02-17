const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('scenar&proc', 'root', '', {
    host: 'localhost',
    dialect: 'mysql' 
});
const scenario = sequelize.define('scenario', {
  id_scenario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'liste_scenarios', 
  timestamps: false,
});
const Profil = sequelize.define('profil', {
    id_profil: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
}, {
  tableName: 'profil',
  timestamps: false,
    
});
const DocProc = sequelize.define('DocProc', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  id_direction: {
    type: DataTypes.INTEGER,
    references: {
      model: 'direction', 
      key: 'id'
    }
  },
  id_scenario: {
    type: DataTypes.INTEGER,
    references: {
      model: 'scenario', 
      key: 'id'
    }
  },
  id_profil: {
    type: DataTypes.INTEGER,
    references: {
      model: 'profil', 
      key: 'id'
    }
  }
}, {
  tableName: 'doc_proc',
  timestamps: false, 
});

  DocProc.belongsTo(scenario, { foreignKey: 'id_scenario' });
  scenario.hasMany(DocProc, { foreignKey: 'id_scenario' });
  
  DocProc.belongsTo(Profil, { as: 'profil', foreignKey: 'id_profil' });
  Profil.hasMany(DocProc, { as: 'docprocs', foreignKey: 'id_profil' });
 
  module.exports = { DocProc, scenario, Profil };
