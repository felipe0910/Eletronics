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

// 5. NOVA ROTA: BUSCAR PRODUTOS DIRETO DO BANCO DE DADOS
// Essa rota vai ler os 9 iPhones da tabela e mandar para o front-end em JSON
app.MapGet("/api/produtos", () => {
    var produtos = new List<object>();

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        // Seleciona as colunas id_produto, nome, preco e nome_imagem exatamente como na imagem do seu banco
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

    // Retorna a lista real de celulares com o status 200 (Ok)
    return Results.Ok(produtos);
});

// 6. Ligar o servidor na porta que combinamos
app.Run("http://localhost:5050");