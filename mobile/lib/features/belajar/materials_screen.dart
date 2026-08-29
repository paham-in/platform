import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final materialsProvider = FutureProvider.family<List<MaterialMaterialResponse>, int>((ref, chapterId) async =>
    (await ref.read(apiProvider).getMaterialsApi().materialsGet(chapterId: chapterId)).data!);

class MaterialsScreen extends ConsumerWidget {
  const MaterialsScreen({super.key, required this.chapterId});

  final int chapterId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materials = ref.watch(materialsProvider(chapterId));
    return Scaffold(
      appBar: AppBar(title: const Text('Materi')),
      body: AsyncView(
        value: materials,
        onRetry: () => ref.invalidate(materialsProvider(chapterId)),
        builder: (items) {
          if (items.isEmpty) return const EmptyState(icon: Icons.article_outlined, message: 'Belum ada materi.');
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final m = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.article)),
                  title: Text(m.title ?? '-'),
                  subtitle: m.isFree == true ? null : const Text('Khusus member'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/materi/${m.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}