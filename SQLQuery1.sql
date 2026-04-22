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