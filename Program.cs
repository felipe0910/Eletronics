using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 1. Configurações de Arquivos (Essencial para não dar erro 404)
app.UseDefaultFiles();
app.UseStaticFiles();

// 2. String de Conexão
string strConexao = "Server=DESKTOP;Database=EletronicsStore;User Id=sa;Password=1234;TrustServerCertificate=True;";

// 3. ROTA DE CADASTRO
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

// 4. ROTA DE LOGIN
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

// 5. Ligar o servidor na porta que combinamos
app.Run("http://localhost:5050");