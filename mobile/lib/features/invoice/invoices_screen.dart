import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final invoicesProvider = FutureProvider.autoDispose<List<InvoiceInvoiceResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getStudentApi().invoicesGet())));

class InvoicesScreen extends ConsumerWidget {
  const InvoicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoices = ref.watch(invoicesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Invoice')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/invoice/berlangganan'),
        icon: const Icon(Icons.add_card),
        label: const Text('Berlangganan'),
      ),
      body: AsyncView(
        value: invoices,
        onRetry: () => ref.invalidate(invoicesProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(
                icon: Icons.receipt_long_outlined,
                message: 'Belum ada invoice. Berlangganan untuk membuka materi.',
                action: null);
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final inv = items[i];
              final color = switch (inv.status) {
                'paid' => Colors.green,
                'pending' => Colors.orange,
                'expired' => Colors.grey,
                _ => Colors.grey,
              };
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: Icon(Icons.receipt_long, color: color),
                  title: Text(formatRupiah(inv.amount)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${formatDate(inv.startDate)} s/d ${formatDate(inv.endDate)}'),
                      Text(inv.note ?? ''),
                    ],
                  ),
                  isThreeLine: true,
                  trailing: Chip(
                    label: Text(inv.status ?? '-'),
                    labelStyle: TextStyle(color: color, fontSize: 11),
                    visualDensity: VisualDensity.compact,
                    side: BorderSide(color: color),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}