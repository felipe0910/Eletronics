using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

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

// 7. ROTA DE PEDIDO: REGISTRAR A COMPRA NO BANCO DE DADOS
app.MapPost("/api/pedidos", async (PedidoDto? pedido) => {
    try {
        if (pedido == null) {
            Console.Error.WriteLine("Pedido nulo recebido.");
            return Results.BadRequest(new { mensagem = "Dados do pedido não foram enviados corretamente." });
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
                INSERT INTO Pedidos (id_produto, quantidade, total_pago, metodo_pagamento, parcelas, endereco_entrega, data_compra)
                VALUES (@id, @q, @t, @m, @p, @e, GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            SqlCommand cmd = new SqlCommand(sql, conn);
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

// 8. ROTA PARA LISTAR PEDIDOS
app.MapGet("/api/pedidos", () => {
    var pedidos = new List<object>();

    using (SqlConnection conn = new SqlConnection(strConexao)) {
        string sql = @"
            SELECT p.id_pedido, p.id_produto, pr.nome as produto_nome, p.quantidade, p.total_pago, p.metodo_pagamento, p.parcelas, p.endereco_entrega, p.data_compra
            FROM Pedidos p
            LEFT JOIN Produtos pr ON p.id_produto = pr.id_produto
            ORDER BY p.data_compra DESC";

        SqlCommand cmd = new SqlCommand(sql, conn);
        conn.Open();

        using (SqlDataReader reader = cmd.ExecuteReader()) {
            while (reader.Read()) {
                pedidos.Add(new {
                    id_pedido = reader.GetInt32(0),
                    id_produto = reader.GetInt32(1),
                    produto_nome = reader.IsDBNull(2) ? "Produto desconhecido" : reader.GetString(2),
                    quantidade = reader.GetInt32(3),
                    total_pago = reader.GetDecimal(4),
                    metodo_pagamento = reader.GetString(5),
                    parcelas = reader.GetInt32(6),
                    endereco_entrega = reader.GetString(7),
                    data_compra = reader.GetDateTime(8)
                });
            }
        }
    }

    return Results.Ok(pedidos);
});

// 9. Ligar o servidor na porta padrão do seu projeto
app.Run("http://localhost:5050");