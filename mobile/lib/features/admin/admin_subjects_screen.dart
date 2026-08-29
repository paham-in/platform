import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';
import '../forum/forum_list_screen.dart' show allSubjectsProvider;

class AdminSubjectsScreen extends ConsumerWidget {
  const AdminSubjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjects = ref.watch(allSubjectsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Mata Pelajaran (Admin)')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Tambah'),
      ),
      body: AsyncView(
        value: subjects,
        onRetry: () => ref.invalidate(allSubjectsProvider),
        builder: (items) => ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final s = items[i];
            return Card(
              child: ListTile(
                leading: const CircleAvatar(child: Icon(Icons.menu_book)),
                title: Text(s.name ?? '-'),
                subtitle: Text('${s.materialCount ?? 0} materi'),
                trailing: s.programId == null ? null : const Icon(Icons.school),
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
        title: const Text('Tambah Mapel'),
        content: TextField(
          controller: nameCtrl,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Nama mapel', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(context, nameCtrl.text.trim()), child: const Text('Simpan')),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    try {
      await unwrap(ref.read(apiProvider).getAdminApi().adminSubjectsPost(
          body: SubjectAdminCreateSubjectRequest(name: name, classIds: const [])));
      ref.invalidate(allSubjectsProvider);
      if (context.mounted) showToast(context, 'Mapel ditambahkan.');
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }
}