import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final adminMaterialsProvider = FutureProvider.autoDispose<List<MaterialMaterialResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getAdminApi().adminMaterialsGet())));

class AdminMaterialsScreen extends ConsumerWidget {
  const AdminMaterialsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materials = ref.watch(adminMaterialsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Materi (Admin)')),
      body: AsyncView(
        value: materials,
        onRetry: () => ref.invalidate(adminMaterialsProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.article_outlined, message: 'Belum ada materi.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final m = items[i];
              final color = switch (m.status) {
                'published' => Colors.green,
                'draft' => Colors.grey,
                _ => Colors.orange,
              };
              return Card(
                child: ListTile(
                  leading: Icon(Icons.article, color: color),
                  title: Text(m.title ?? '-'),
                  subtitle: Text('${m.chapterName ?? ''} • ${m.type ?? ''}'),
                  trailing: Chip(
                    label: Text(m.status ?? '-'),
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