import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final collectionsProvider = FutureProvider<List<QuestionpackageCollectionResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getQuestionPackageApi().questionPackageCollectionsGet())));

class PackageCollectionsScreen extends ConsumerWidget {
  const PackageCollectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collections = ref.watch(collectionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Paket Soal')),
      body: AsyncView(
        value: collections,
        onRetry: () => ref.invalidate(collectionsProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.quiz_outlined, message: 'Belum ada paket soal.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final c = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.quiz)),
                  title: Text(c.name ?? '-'),
                  subtitle: c.className == null ? Text('${c.packageCount ?? 0} paket') : Text('${c.className} • ${c.packageCount ?? 0} paket'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    final packages = c.packages ?? const <QuestionpackagePackageResponse>[];
                    if (packages.length == 1) {
                      context.push('/paket/kerja/${packages.first.publicId}');
                    } else if (packages.isNotEmpty) {
                      context.push('/paket/${c.publicId}');
                    } else {
                      showToast(context, 'Belum ada paket dalam koleksi ini.');
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}

final packagesInCollectionProvider =
    FutureProvider.family<List<QuestionpackagePackageResponse>, String>((ref, publicId) async {
  final collections = await unwrap(ref.read(apiProvider).getQuestionPackageApi().questionPackageCollectionsGet());
  return collections.firstWhere((c) => c.publicId == publicId).packages ?? const [];
});

class PackagesInCollectionScreen extends ConsumerWidget {
  const PackagesInCollectionScreen({super.key, required this.publicId});

  final String publicId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final packages = ref.watch(packagesInCollectionProvider(publicId));
    return Scaffold(
      appBar: AppBar(title: const Text('Paket')),
      body: AsyncView(
        value: packages,
        builder: (items) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final p = items[i];
            return Card(
              clipBehavior: Clip.antiAlias,
              child: ListTile(
                title: Text(p.name ?? '-'),
                subtitle: Text('${p.questions?.length ?? 0} soal'),
                trailing: const Icon(Icons.play_circle_outline),
                onTap: () => context.push('/paket/kerja/${p.publicId}'),
              ),
            );
          },
        ),
      ),
    );
  }
}