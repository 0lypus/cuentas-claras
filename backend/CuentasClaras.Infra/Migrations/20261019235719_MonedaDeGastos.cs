using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CuentasClaras.Infra.Migrations
{
    /// <inheritdoc />
    public partial class MonedaDeGastos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Moneda",
                table: "Gastos",
                type: "TEXT",
                maxLength: 3,
                nullable: false,
                defaultValue: "ARS");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Moneda",
                table: "Gastos");
        }
    }
}
