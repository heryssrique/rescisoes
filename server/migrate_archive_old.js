/**
 * SCRIPT DE MIGRAÇÃO: Arquivar registros anteriores a 01/03/2026
 *
 * O que faz:
 *  1. Busca todos os registros com dataPagamento < "2026-03-01"
 *  2. Marca o checklist item 'p2' (Comprovante arquivado) como concluído
 *  3. Marca o status como 'pago' (se ainda não estiver)
 *  4. Marca arquivado = true
 *  5. Adiciona entrada no histórico
 *
 * Uso: node server/migrate_archive_old.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Desligamento = require('./models/Desligamento');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/desligest';
const CUTOFF_DATE = '2026-03-01'; // Registros ANTERIORES a esta data serão arquivados

async function run() {
  console.log('🔗 Conectando ao MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado.\n');

  const now = new Date().toISOString().slice(0, 19);

  // Busca todos os não arquivados com dataPagamento anterior ao corte
  const docs = await Desligamento.find({
    arquivado: { $ne: true },
    dataPagamento: { $lt: CUTOFF_DATE, $gt: '' },
  });

  console.log(`📋 Encontrados ${docs.length} registros para arquivar (dataPagamento < ${CUTOFF_DATE})\n`);

  if (docs.length === 0) {
    console.log('Nenhum registro encontrado. Encerrando.');
    await mongoose.disconnect();
    return;
  }

  let sucesso = 0;
  let erro = 0;

  for (const doc of docs) {
    try {
      // Atualiza checklist: marca p2 como concluído (e p1 se não estiver)
      const updatedChecklist = (doc.checklist || []).map(item => {
        if (item.id === 'p1' || item.id === 'p2') {
          return { ...item.toObject(), done: true, doneAt: now, notApplicable: false };
        }
        return item;
      });

      const histEntry = {
        data: now,
        acao: 'Arquivado automaticamente (migração)',
        nota: `Processo arquivado em lote — pagamento anterior a ${CUTOFF_DATE}.`
      };

      await Desligamento.findByIdAndUpdate(doc._id, {
        $set: {
          arquivado: true,
          status: 'pago',
          checklist: updatedChecklist,
        },
        $push: {
          historico: histEntry
        }
      });

      sucesso++;
      process.stdout.write(`  ✓ [${sucesso}/${docs.length}] ${doc.nome}\r`);
    } catch (err) {
      erro++;
      console.error(`\n  ✗ ERRO em ${doc.nome}: ${err.message}`);
    }
  }

  console.log(`\n\n═══════════════════════════════════`);
  console.log(`✅ Migração concluída!`);
  console.log(`   Arquivados com sucesso : ${sucesso}`);
  console.log(`   Erros                  : ${erro}`);
  console.log(`═══════════════════════════════════`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado do MongoDB.');
}

run().catch(err => {
  console.error('❌ Erro fatal na migração:', err);
  process.exit(1);
});
