using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddPolicy("capacitor", policy =>
    policy.WithOrigins("https://localhost", "capacitor://localhost")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseCors("capacitor");

// 1. Configurações de Arquivos (Essencial para não dar erro 404)
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions {
    OnPrepareResponse = ctx => {
        ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        ctx.Context.Response.Headers["Pragma"] = "no-cache";
        ctx.Context.Response.Headers["Expires"] = "-1";
    }
});

// 2. String de Conexão (A mesma que você já usa)
string strConexao = "Server=DESKTOP;Database=EletronicsStore;User Id=sa;Password=1234;TrustServerCertificate=True;";

// Tentativa de migração automática: garante que a coluna id_usuario exista em Pedidos
try {
    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = @"
            IF COL_LENGTH('Pedidos', 'id_usuario') IS NULL
            BEGIN
                ALTER TABLE Pedidos ADD id_usuario INT NULL;
                ALTER TABLE Pedidos ADD CONSTRAINT FK_Pedidos_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(Id);
            END";
        SqlCommand cmd = new SqlCommand(sql, conn);
        conn.Open();
        cmd.ExecuteNonQuery();
    }
}
catch (Exception ex) {
    Console.Error.WriteLine($"Erro ao aplicar migração automática: {ex}");
}

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

// 4. ROTA DE LOGIN - Retorna JSON com dados do usuário (frontend salva em localStorage)
app.MapPost("/login", async (HttpContext contexto) => {
    var form = await contexto.Request.ReadFormAsync();

    string email = form["email"].ToString();
    string senha = form["senha"].ToString();

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "SELECT Id, NomeCompleto, Email FROM Usuarios WHERE Email = @e AND Senha = @s";
        SqlCommand cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@e", email);
        cmd.Parameters.AddWithValue("@s", senha);

        conn.Open();
        using (SqlDataReader reader = cmd.ExecuteReader()) {
            if (reader.Read()) {
                int idUsuario = reader.GetInt32(0);
                string nome = reader.IsDBNull(1) ? "" : reader.GetString(1);
                string emailUsuario = reader.GetString(2);

                // Retornar JSON com dados do usuário (frontend salva em localStorage)
                return Results.Ok(new { 
                    id_usuario = idUsuario, 
                    nome = nome, 
                    email = emailUsuario 
                });
            }
        }
    }

    return Results.BadRequest(new { erro = "Email ou senha inválidos." });
});


// Endpoint para obter info do usuário logado - NÃO NECESSÁRIO COM localStorage
// (Frontend gerencia estado localmente)

// Logout simples - apenas retorna OK (frontend limpa localStorage)
app.MapPost("/logout", (HttpContext contexto) => {
    return Results.Ok(new { mensagem = "Desconectado." });
});

// 5. ROTA GERAL: BUSCAR PRODUTOS, COM FILTRO POR CATEGORIA
app.MapGet("/api/produtos", (HttpRequest request) => {
    var produtos = new List<object>();
    string categoria = request.Query["categoria"].ToString().Trim();
    string q = request.Query["q"].ToString().Trim();

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = "SELECT id_produto, nome, preco, nome_imagem FROM Produtos";
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = conn;

        var conditions = new List<string>();

        if (!string.IsNullOrWhiteSpace(categoria)) {
            string filtroCategoria = categoria.ToLowerInvariant() switch {
                "computadores" => "%computador%",
                "notebooks" => "%notebook%",
                "smartphones" => "%smartphone%",
                "fones" => "%fone%",
                _ => $"%{categoria.ToLowerInvariant()}%"
            };

            conditions.Add("LOWER(categoria) LIKE @categoria");
            cmd.Parameters.AddWithValue("@categoria", filtroCategoria);
        }

        if (!string.IsNullOrWhiteSpace(q)) {
            conditions.Add("LOWER(nome) LIKE @q");
            cmd.Parameters.AddWithValue("@q", "%" + q.ToLowerInvariant() + "%");
        }

        if (conditions.Count > 0) {
            sql += " WHERE " + string.Join(" AND ", conditions);
        }

        cmd.CommandText = sql;
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
    object? produtoEncontrado = null;

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

// 7. ROTA DE PEDIDO: REGISTRAR A COMPRA NO BANCO DE DADOS
app.MapPost("/api/pedidos", async (PedidoDto? pedido) => {
    try {
        if (pedido == null) {
            Console.Error.WriteLine("Pedido nulo recebido.");
            return Results.BadRequest(new { mensagem = "Dados do pedido não foram enviados corretamente." });
        }

        // Validar id_usuario foi enviado
        if (pedido.id_usuario <= 0) {
            return Results.BadRequest(new { mensagem = "Usuário não autenticado." });
        }

        if (pedido.id_produto <= 0 || pedido.quantidade <= 0 || string.IsNullOrWhiteSpace(pedido.endereco_entrega) || string.IsNullOrWhiteSpace(pedido.metodo_pagamento) || pedido.parcelas <= 0) {
            Console.Error.WriteLine($"Dados do pedido incompletos: {System.Text.Json.JsonSerializer.Serialize(pedido)}");
            return Results.BadRequest(new { mensagem = "Dados do pedido incompletos." });
        }

        string endereco = pedido.endereco_entrega!;
        string metodo = pedido.metodo_pagamento!;

        int novoPedidoId;
        using (SqlConnection conn = new SqlConnection(strConexao)) {
            string sql = @"
                INSERT INTO Pedidos (id_usuario, id_produto, quantidade, total_pago, metodo_pagamento, parcelas, endereco_entrega, data_compra)
                VALUES (@usuarioId, @id, @q, @t, @m, @p, @e, GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            SqlCommand cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@usuarioId", pedido.id_usuario);
            cmd.Parameters.AddWithValue("@id", pedido.id_produto);
            cmd.Parameters.AddWithValue("@q", pedido.quantidade);
            cmd.Parameters.AddWithValue("@t", pedido.total_pago);
            cmd.Parameters.AddWithValue("@m", metodo);
            cmd.Parameters.AddWithValue("@p", pedido.parcelas);
            cmd.Parameters.AddWithValue("@e", endereco);

            conn.Open();
            object? result = cmd.ExecuteScalar();
            if (result == null || result == DBNull.Value) {
                throw new InvalidOperationException("Não foi possível obter o ID do pedido após o INSERT.");
            }
            novoPedidoId = Convert.ToInt32(result);
        }

        return Results.Ok(new { id_pedido = novoPedidoId, mensagem = "Pedido registrado com sucesso." });
    }
    catch (Exception ex) {
        Console.Error.WriteLine($"Erro ao registrar pedido: {ex}");
        return Results.Problem(detail: ex.Message, title: "Erro ao registrar pedido");
    }
});

// 8. ROTA PARA LISTAR PEDIDOS - Recebe id_usuario como query parameter
app.MapGet("/api/pedidos", (HttpRequest request) => {
    // Lê id_usuario do query parameter
    string? usuarioIdStr = request.Query["id_usuario"].ToString();
    if (!int.TryParse(usuarioIdStr, out var usuarioId) || usuarioId <= 0) {
        return Results.BadRequest(new { erro = "Usuário não autenticado." });
    }

    var pedidos = new List<object>();

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = @"
            SELECT p.id_pedido, p.id_produto, pr.nome as produto_nome, pr.nome_imagem as produto_imagem, p.quantidade, p.total_pago, p.metodo_pagamento, p.parcelas, p.endereco_entrega, p.data_compra
            FROM Pedidos p
            LEFT JOIN Produtos pr ON p.id_produto = pr.id_produto
            WHERE p.id_usuario = @usuarioId
            ORDER BY p.data_compra DESC";

        SqlCommand cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@usuarioId", usuarioId);
        conn.Open();

        using (SqlDataReader reader = cmd.ExecuteReader()) {
            while (reader.Read()) {
                pedidos.Add(new {
                    id_pedido = reader.GetInt32(0),
                    id_produto = reader.GetInt32(1),
                    produto_nome = reader.IsDBNull(2) ? "Produto desconhecido" : reader.GetString(2),
                    produto_imagem = reader.IsDBNull(3) ? null : reader.GetString(3),
                    quantidade = reader.GetInt32(4),
                    total_pago = reader.GetDecimal(5),
                    metodo_pagamento = reader.GetString(6),
                    parcelas = reader.GetInt32(7),
                    endereco_entrega = reader.GetString(8),
                    data_compra = reader.GetDateTime(9)
                });
            }
        }
    }

    return Results.Ok(pedidos);
});


app.MapGet("/", () =>
    Results.Redirect("/interface_grafica/index.html"));

// 9. Ligar o servidor na porta padrão do seu projeto
app.Run("http://0.0.0.0:5050");