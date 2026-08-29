import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';
import '../belajar/belajar_screen.dart' show classesProvider;
import 'invoices_screen.dart' show invoicesProvider;

class SubscribeScreen extends ConsumerStatefulWidget {
  const SubscribeScreen({super.key});

  @override
  ConsumerState<SubscribeScreen> createState() => _SubscribeScreenState();
}

class _SubscribeScreenState extends ConsumerState<SubscribeScreen> {
  int? _classId;
  num? _amount;
  bool _submitting = false;

  Future<void> _submit() async {
    if (_classId == null || _amount == null) {
      showToast(context, 'Pilih kelas dulu.');
      return;
    }
    setState(() => _submitting = true);
    final now = DateTime.now();
    String iso(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    try {
      await unwrap(ref.read(apiProvider).getStudentApi().subscribePost(
            body: InvoiceCreateInput(
              classId: _classId,
              amount: _amount,
              startDate: iso(now),
              endDate: iso(now.add(const Duration(days: 30))),
            ),
          ));
      if (mounted) {
        showToast(context, 'Invoice dibuat. Hubungi admin untuk pembayaran.');
        ref.invalidate(invoicesProvider);
        context.pop();
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final classes = ref.watch(classesProvider);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Berlangganan')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AsyncView(
            value: classes,
            builder: (items) => DropdownButtonFormField<int>(
              initialValue: _classId,
              decoration: const InputDecoration(labelText: 'Pilih Kelas', border: OutlineInputBorder(), isDense: true),
              items: [for (final c in items) DropdownMenuItem(value: c.id, child: Text(c.name ?? '-'))],
              onChanged: (v) {
                setState(() {
                  _classId = v;
                  final c = items.firstWhere((x) => x.id == v);
                  _amount = c.groupPrice;
                });
              },
            ),
          ),
          const SizedBox(height: 16),
          if (_amount != null)
            Text('Harga berlangganan: ${formatRupiah(_amount)}', style: theme.textTheme.titleMedium),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.payment),
            label: Text(_submitting ? 'Membuat invoice...' : 'Buat Invoice'),
          ),
        ],
      ),
    );
  }
}