using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CuentasClaras.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AgregarReparto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DetalleReparto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GastoId = table.Column<int>(type: "INTEGER", nullable: false),
                    MiembroId = table.Column<int>(type: "INTEGER", nullable: false),
                    Monto = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetalleReparto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetalleReparto_Gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "Gastos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DetalleReparto_Miembros_MiembroId",
                        column: x => x.MiembroId,
                        principalTable: "Miembros",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetalleReparto_GastoId_MiembroId",
                table: "DetalleReparto",
                columns: new[] { "GastoId", "MiembroId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DetalleReparto_MiembroId",
                table: "DetalleReparto",
                column: "MiembroId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetalleReparto");
        }
    }
}
