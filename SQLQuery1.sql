CREATE DATABASE EletronicsStore;
GO
USE EletronicsStore;
GO
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY(1,1),
    NomeCompleto VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Senha VARCHAR(255) NOT NULL -- Lembre-se: nunca salve senha em texto puro em produção!
);

-- Migration: adicionar coluna id_usuario em Pedidos e chave estrangeira para Usuarios
IF COL_LENGTH('Pedidos', 'id_usuario') IS NULL
BEGIN
    ALTER TABLE Pedidos ADD id_usuario INT NULL;
    -- Ajuste a referência abaixo ao nome da PK em Usuarios caso seja diferente (Id ou id_usuario)
    ALTER TABLE Pedidos ADD CONSTRAINT FK_Pedidos_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(Id);
END