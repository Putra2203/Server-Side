'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Presensi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Menambahkan relasi belongsTo dengan model Pesertas (Pengguna)
      Presensi.belongsTo(models.Peserta_Magang, {
        foreignKey: 'p_id', // Kolom foreign key di tabel Presensi
        as: 'peserta_magang', // Alias untuk relasi, bisa digunakan saat include
      });
    }
  }
  
  Presensi.init({
    tanggal: DataTypes.DATEONLY,
    check_in: DataTypes.DATE,
    check_out: DataTypes.DATE,
    image_url_in: DataTypes.STRING,
    image_url_out: DataTypes.STRING,
    p_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Presensi',
  });
  
  return Presensi;
};
