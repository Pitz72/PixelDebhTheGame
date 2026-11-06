<?php
/**
 * Prepara il runtime ISOLATO del sito di PixelDebh per provare il torneo dal gioco (docs/TORNEO.md, fase 3).
 *
 * Non tocca né il database di sviluppo (porta 8123) né il sito vero: lavora solo dentro PIXELDEBH_PROVA_DIR, una
 * cartella usa e getta con `.data`, `.cache` e `uploads`, la stessa che usa il server di prova del sito avviato con
 * quella variabile. Crea lo schema come api/init_db.php, svuota i tornei e i freni delle richieste (i contatori del
 * runtime isolato: dopo 30 invii in 10 minuti il sito risponde 429) e apre un torneo; stampa in JSON l'id, lo stato,
 * la chiave di quel runtime (casuale, nata con lo schema) e quante partite e copie ci sono.
 *
 *   PIXELDEBH_PROVA_DIR=<cartella> php tools/dev/torneo/prepara.php apri     # schema + un torneo aperto per due giorni
 *   PIXELDEBH_PROVA_DIR=<cartella> php tools/dev/torneo/prepara.php chiudi   # lo chiude (finito un'ora fa)
 *   PIXELDEBH_PROVA_DIR=<cartella> php tools/dev/torneo/prepara.php          # solo lo stato
 *
 * Il progetto del sito si cerca in PIXELDEBH_SITO (la cartella che contiene public/), di norma quella accanto a questa.
 */
$prova = getenv('PIXELDEBH_PROVA_DIR');
if ($prova === false || $prova === '' || !is_dir($prova)) { fwrite(STDERR, "Serve PIXELDEBH_PROVA_DIR, una cartella che esiste.\n"); exit(1); }
$sito = rtrim(str_replace('\\', '/', (string) (getenv('PIXELDEBH_SITO') ?: 'C:/Users/Utente/Documents/GitHub/SITI-WEB/PIXELDEBH-Sito')), '/') . '/public';
require_once $sito . '/api/auth_helper.php';
require_once $sito . '/lib/schema.php';
require_once $sito . '/lib/torneo.php';

if (!Database::inProva()) { fwrite(STDERR, "Non sono nel runtime isolato: mi fermo.\n"); exit(1); }
$pdo = Database::connect();
$azione = $argv[1] ?? 'stato';

if ($azione === 'apri') {
    pixeldebh_schema_applica($pdo);
    schema_segna($pdo, PIXELDEBH_SCHEMA);
    $pdo->exec('DELETE FROM tornei');
    $pdo->exec('DELETE FROM torneo_partite');
    $pdo->exec('DELETE FROM torneo_copie');
    // the site's brakes (30 writes every 10 minutes per network) count in files: a fresh start for the tests
    foreach (glob(Database::cartellaCache() . '/ratelimit/*.json') ?: [] as $f) { @unlink($f); }
    $versione = (string) (getenv('TORNEO_VERSIONE_MINIMA') ?: '');
    $righe = [
        'titolo' => 'Prova del gioco', 'regole' => TORNEO_REGOLE_BASE,
        'inizia_il' => gmdate('Y-m-d\TH:i:s\Z', time() - 3600), 'finisce_il' => gmdate('Y-m-d\TH:i:s\Z', time() + 2 * 86400),
        'versione_minima' => $versione, 'visibile' => 1, 'created_at' => adesso_utc(), 'updated_at' => adesso_utc(),
    ];
    $pdo->prepare('INSERT INTO tornei (' . implode(', ', array_keys($righe)) . ') VALUES (' . implode(', ', array_fill(0, count($righe), '?')) . ')')
        ->execute(array_values($righe));
    torneo_pubblica($pdo);
}
if ($azione === 'chiudi') {
    $pdo->prepare('UPDATE tornei SET finisce_il = ?')->execute([gmdate('Y-m-d\TH:i:s\Z', time() - 3600)]);
    torneo_pubblica($pdo);
}
$t = torneo_pubblico($pdo);
echo json_encode([
    'id' => $t ? (int) $t['id'] : null, 'stato' => $t ? torneo_stato($t) : null, 'versione_minima' => $t ? (string) $t['versione_minima'] : null,
    'chiave' => torneo_chiave(),
    'partite' => (int) $pdo->query('SELECT COUNT(*) FROM torneo_partite')->fetchColumn(),
    'copie' => (int) $pdo->query('SELECT COUNT(*) FROM torneo_copie')->fetchColumn(),
]), "\n";
