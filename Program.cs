using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 1. Configurações de Arquivos (Essencial para não dar erro 404)
app.UseDefaultFiles();
app.UseStaticFiles();

// 2. String de Conexão (A mesma que você já usa)
string strConexao = "Server=DESKTOP;Database=EletronicsStore;User Id=sa;Password=1234;TrustServerCertificate=True;";

// 3. ROTA DE CADASTRO (Mantida intacta)
app.MapPost("/cadastrar-usuario", async (HttpContext contexto) => {
    var form = await contexto.Request.ReadFormAsync();
    
    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "INSERT INTO Usuarios (NomeCompleto, Email, Senha) VALUES (@n, @e, @s)";
        SqlCommand cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@n", form["nomeCompleto"].ToString());
        cmd.Parameters.AddWithValue("@e", form["email"].ToString());
        cmd.Parameters.AddWithValue("@s", form["senha"].ToString());
        
        conn.Open();
        cmd.ExecuteNonQuery();
    }
    return Results.Redirect("/interface_grafica/tela-login.html");
});

// 4. ROTA DE LOGIN (Mantida intacta)
app.MapPost("/login", async (HttpContext contexto) => {
    var form = await contexto.Request.ReadFormAsync();

    string email = form["email"].ToString();
    string senha = form["senha"].ToString();
   
    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "SELECT COUNT(*) FROM Usuarios WHERE Email = @e AND Senha = @s";
        SqlCommand cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@e", email);
        cmd.Parameters.AddWithValue("@s", senha);
        
        conn.Open();
        int existe = (int)cmd.ExecuteScalar();

        if (existe > 0) {
            return Results.Redirect("/interface_grafica/home.html");
        } else {
            return Results.Redirect("/interface_grafica/tela-login.html?erro=1");
        }
    }
});

// 5. ROTA GERAL: BUSCAR TODOS OS PRODUTOS (Mantida intacta)
app.MapGet("/api/produtos", () => {
    var produtos = new List<object>();

using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "SELECT id_produto, nome, preco, nome_imagem FROM Produtos WHERE categoria = 'Smartphones'";
        SqlCommand cmd = new SqlCommand(sql, conn);

        conn.Open();
        using (SqlDataReader reader = cmd.ExecuteReader()) {
            while (reader.Read()) {
                produtos.Add(new {
                    id_produto = reader.GetInt32(0),
                    nome = reader.GetString(1),
                    preco = reader.GetDecimal(2),
                    nome_imagem = reader.GetString(3)
                });
            }
        }
    }
 return Results.Ok(produtos);
});

// 6. ROTA DO BOTÃO COMPRAR: BUSCAR UM PRODUTO ÚNICO POR ID
// Pega a imagem e a 'descricao_comercial' específica do celular clicado
app.MapGet("/api/produtos/{id}", (int id) => {
    object produtoEncontrado = null;

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "SELECT id_produto, nome, preco, nome_imagem, descricao_comercial FROM Produtos WHERE id_produto = @id";
        SqlCommand cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);

        conn.Open();
        using (SqlDataReader reader = cmd.ExecuteReader()) {
            if (reader.Read()) {
                produtoEncontrado = new {
                    id_produto = reader.GetInt32(0),
                    nome = reader.GetString(1),
                    preco = reader.GetDecimal(2),
                    nome_imagem = reader.GetString(3),
                    descricao_comercial = reader.GetString(4)
                };
            }
        }
    }

    if (produtoEncontrado == null) {
        return Results.NotFound(new { mensagem = "Produto não encontrado." });
    }

    return Results.Ok(produtoEncontrado);
});

// 7. Ligar o servidor na porta padrão do seu projeto
app.Run("http://localhost:5050");