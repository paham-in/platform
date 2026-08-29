import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final materialProvider = FutureProvider.family<MaterialMaterialResponse, int>((ref, id) async =>
    (await ref.read(apiProvider).getMaterialsApi().materialsIdGet(id: id)).data!);

class MaterialDetailScreen extends ConsumerWidget {
  const MaterialDetailScreen({super.key, required this.id});

  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final material = ref.watch(materialProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Materi')),
      body: AsyncView(
        value: material,
        onRetry: () => ref.invalidate(materialProvider(id)),
        builder: (m) {
          final content = stripHtml(m.content);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(m.title ?? '-', style: Theme.of(context).textTheme.headlineSmall),
              if (m.chapterName != null) ...[
                const SizedBox(height: 4),
                Text(m.chapterName!, style: Theme.of(context).textTheme.bodySmall),
              ],
              const SizedBox(height: 16),
              if (m.videoUrl != null)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.play_circle_fill),
                    title: const Text('Tonton video'),
                    subtitle: Text(m.videoUrl!),
                    onTap: () => launchUrl(Uri.parse(m.videoUrl!), mode: LaunchMode.externalApplication),
                  ),
                ),
              const SizedBox(height: 12),
              if (content.isNotEmpty)
                SelectableText(content, style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.6))
              else
                const Text('Konten kosong.'),
            ],
          );
        },
      ),
    );
  }
}