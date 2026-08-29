import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final adminClassesProvider = FutureProvider.autoDispose<List<ClassClassResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getAdminApi().adminClassesGet())));

class AdminClassesScreen extends ConsumerWidget {
  const AdminClassesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final classes = ref.watch(adminClassesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Kelas (Admin)')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Tambah'),
      ),
      body: AsyncView(
        value: classes,
        onRetry: () => ref.invalidate(adminClassesProvider),
        builder: (items) => ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final c = items[i];
            return Card(
              child: ListTile(
                title: Text(c.name ?? '-'),
                subtitle: Text(
                  '${formatRupiah(c.groupPrice)}/bulan • ${formatRupiah(c.pricePerSession)}/sesi\n${c.slug ?? ''}',
                ),
                isThreeLine: true,
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref) async {
    final nameCtrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tambah Kelas'),
        content: TextField(
          controller: nameCtrl,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Nama kelas', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(context, nameCtrl.text.trim()), child: const Text('Simpan')),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    try {
      await unwrap(ref.read(apiProvider).getAdminApi().adminClassesPost(body: {'name': name}));
      ref.invalidate(adminClassesProvider);
      if (context.mounted) showToast(context, 'Kelas ditambahkan.');
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }
}