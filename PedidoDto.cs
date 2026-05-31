public class PedidoDto
{
    public int id_usuario { get; set; }
    public int id_produto { get; set; }
    public int quantidade { get; set; }
    public decimal total_pago { get; set; }
    public string? metodo_pagamento { get; set; }
    public int parcelas { get; set; }
    public string? endereco_entrega { get; set; }
}
