'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Presensis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tanggal: {
        type: Sequelize.DATEONLY,
      },
      check_in: {
        type: Sequelize.DATE,
      },
      check_out: {
        type: Sequelize.DATE,
      },
      image_url_in: {
        type: Sequelize.STRING,
      },
      image_url_out: {
        type: Sequelize.STRING,
      },
      lokasi_in: {
        type: Sequelize.STRING, // Menyimpan koordinat lokasi check-in
      },
      lokasi_out: {
        type: Sequelize.STRING, // Menyimpan koordinat lokasi check-out
      },
      p_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Peserta_Magangs',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Presensis');
  },
};
