# GeraPro - puxa os backups da VPS Hostgator para o PC (off-site via OneDrive)
# Agendado diariamente pelo Agendador de Tarefas (tarefa: "GeraPro Backup Pull")
$ErrorActionPreference = 'Stop'

$destino   = "C:\Users\jcc14\OneDrive\GeraProBackups"
$sshKey    = "$env:USERPROFILE\.ssh\hostgator_vps"
$alvo      = "cacir@143.95.174.12"
$porta     = 22022
$log       = Join-Path $destino "pull.log"
$diasRetencao = 14   # espelha a rotacao da VPS

function Log($msg) {
    $linha = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Add-Content -Path $log -Value $linha
    Write-Output $linha
}

function Baixar($remoto, $local) {
    # scp exige prefixo host: - a saida do ls vem so com o caminho
    $origem = "${alvo}:${remoto}"
    & scp -P $porta -i $sshKey -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 $origem $local
    if ($LASTEXITCODE -ne 0) { throw "scp falhou em $remoto" }
}

New-Item -ItemType Directory -Force -Path $destino | Out-Null
$ssh = @("-p", $porta, "-i", $sshKey, "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "ServerAliveInterval=5", "-o", "ServerAliveCountMax=3")

try {
    # 1. dumps do PostgreSQL (pg_dump diario) - puxa so os que faltam localmente
    $remotos = & ssh @ssh $alvo "ls /home/cacir/backups/pg/*.dump 2>/dev/null" |
               ForEach-Object { "$_".Trim() } | Where-Object { $_ -match '\.dump$' }
    if (-not $remotos) { throw "nenhum dump encontrado na VPS (verificar cron gerapro-pg-dump)" }

    $novos = 0
    foreach ($r in $remotos) {
        $nome = [IO.Path]::GetFileName($r)
        $local = Join-Path $destino $nome
        if (-not (Test-Path $local)) {
            Baixar $r $local
            $novos++
        }
    }
    Log "dumps: $($remotos.Count) na VPS, $novos novos puxados"

    # 2. rotacao local (mesmos 14 dias da VPS)
    $corte = (Get-Date).AddDays(-$diasRetencao)
    $velhos = Get-ChildItem $destino -Filter "gerapro-*.dump" -ErrorAction SilentlyContinue |
              Where-Object { $_.LastWriteTime -lt $corte }
    foreach ($v in $velhos) { Remove-Item $v.FullName -Force }
    if ($velhos) { Log "rotacao local: $($velhos.Count) dump(s) antigo(s) removido(s)" }

    # 3. backups do SQLite legado (fonte do rollback) - uma unica vez
    $legados = & ssh @ssh $alvo "ls /home/cacir/backups/gerapro-sqlite-pre-pg-*.db /home/cacir/backups/gerapro.db.gz 2>/dev/null" |
               ForEach-Object { "$_".Trim() } | Where-Object { $_ -match '\.(db|gz)$' }
    foreach ($r in $legados) {
        $nome = [IO.Path]::GetFileName($r)
        $local = Join-Path $destino $nome
        if (-not (Test-Path $local)) {
            Baixar $r $local
            Log "SQLite legado puxado: $nome"
        }
    }

    # 4. resumo
    $total = (Get-ChildItem $destino -File | Measure-Object Length -Sum).Sum
    Log ("OK - total em {0}: {1:N1} MB" -f $destino, ($total / 1MB))
    exit 0
}
catch {
    Log "ERRO: $($_.Exception.Message)"
    exit 1
}
