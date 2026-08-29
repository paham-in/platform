import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final earningsProvider =
    FutureProvider.autoDispose<TutoringMyEarningsResponse>((ref) async =>
        (await unwrap(ref.read(apiProvider).getTutoringApi().tutoringEarningsGet())));

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final earnings = ref.watch(earningsProvider);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Pendapatan')),
      body: AsyncView(
        value: earnings,
        onRetry: () => ref.invalidate(earningsProvider),
        builder: (e) {
          if (e.sessions?.isEmpty ?? true) {
            return const EmptyState(icon: Icons.payments_outlined, message: 'Belum ada sesi selesai.');
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                color: theme.colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total Fee', style: theme.textTheme.labelLarge),
                      Text(formatRupiah(e.totalFee),
                          style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('Tersedia: ${formatRupiah(e.feeAvailableTotal)}', style: theme.textTheme.bodySmall),
                      Text('Dibayar: ${formatRupiah(e.feePaidTotal)}', style: theme.textTheme.bodySmall),
                      Text('Diambil: ${formatRupiah(e.feeTakenTotal)}', style: theme.textTheme.bodySmall),
                      Text('Belum dibayar: ${formatRupiah(e.feeUnpaidTotal)}', style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Riwayat Sesi', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final s in e.sessions ?? const <TutoringListSessionsResponse>[])
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.event_note),
                  title: Text('${s.studentName ?? ''} • ${formatDate(s.date)} ${s.startTime ?? ''}'),
                  subtitle: Text('Fee: ${formatRupiah(s.feeAmount)} • ${s.status ?? ''}'),
                  trailing: s.feePaid == true
                      ? const Icon(Icons.check_circle, color: Colors.green)
                      : const Icon(Icons.schedule, color: Colors.orange),
                ),
              if (e.feeAvailableTotal != null && e.feeAvailableTotal! > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: FilledButton.icon(
                    onPressed: () async {
                      try {
                        final ids = e.sessions
                                ?.where((s) => s.feePaid == true && s.status == 'done')
                                .map((s) => s.id!)
                                .toList() ??
                            const <int>[];
                        if (ids.isEmpty) {
                          if (context.mounted) {
                            showToast(context, 'Tidak ada fee yang bisa diambil.');
                          }
                          return;
                        }
                        await unwrap(ref.read(apiProvider).getTutoringApi().tutoringEarningsTakenPatch(
                            body: TutoringMarkEarningsTakenRequest(sessionIds: ids)));
                        ref.invalidate(earningsProvider);
                        if (context.mounted) {
                          showToast(context, 'Fee berhasil ditandai diambil.');
                        }
                      } catch (e) {
                        if (context.mounted) showError(context, e);
                      }
                    },
                    icon: const Icon(Icons.payments),
                    label: const Text('Tandai Fee Diambil'),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}