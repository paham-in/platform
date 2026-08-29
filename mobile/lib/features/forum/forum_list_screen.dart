import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

class ForumFilter {
  ForumFilter({this.subjectId, this.search});
  final int? subjectId;
  final String? search;

  @override
  bool operator ==(Object other) =>
      other is ForumFilter && other.subjectId == subjectId && other.search == search;

  @override
  int get hashCode => Object.hash(subjectId, search);
}

final forumQuestionsProvider =
    FutureProvider.autoDispose.family<List<ForumQuestionResponse>, ForumFilter>((ref, f) async =>
        (await ref.read(apiProvider).getForumApi().questionsGet(subjectId: f.subjectId, search: f.search)).data!);

class ForumListScreen extends ConsumerStatefulWidget {
  const ForumListScreen({super.key});

  @override
  ConsumerState<ForumListScreen> createState() => _ForumListScreenState();
}

class _ForumListScreenState extends ConsumerState<ForumListScreen> {
  int? _subjectId;
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final questions = ref.watch(forumQuestionsProvider(ForumFilter(subjectId: _subjectId)));
    final subjects = ref.watch(allSubjectsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Forum'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Cari pertanyaan...',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                subjects.maybeWhen(
                  data: (items) => DropdownButton<int>(
                    value: _subjectId,
                    hint: const Text('Mapel'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Semua')),
                      for (final s in items) DropdownMenuItem(value: s.id, child: Text(s.name ?? '-')),
                    ],
                    onChanged: (v) => setState(() => _subjectId = v),
                  ),
                  orElse: () => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/forum/tanya'),
        icon: const Icon(Icons.edit),
        label: const Text('Tanya'),
      ),
      body: AsyncView(
        value: questions,
        onRetry: () => ref.invalidate(forumQuestionsProvider(ForumFilter(subjectId: _subjectId))),
        builder: (items) {
          final filtered = _searchCtrl.text.trim().isEmpty
              ? items
              : items.where((q) => (q.subjectName ?? '').toLowerCase().contains(_searchCtrl.text.trim().toLowerCase())).toList();
          if (filtered.isEmpty) {
            return const EmptyState(icon: Icons.forum_outlined, message: 'Belum ada pertanyaan.');
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
            itemCount: filtered.length,
            itemBuilder: (context, i) {
              final q = filtered[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  title: Text(stripHtml((q.plainContent ?? '').isNotEmpty ? q.plainContent! : q.content),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${q.subjectName ?? ''} • ${q.userName ?? ''}'),
                        Text(
                          '${q.answerCount ?? 0} jawaban • ${formatDateTime(q.createdAt)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  onTap: () => context.push('/forum/${q.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

final allSubjectsProvider = FutureProvider<List<SubjectListSubjectsResponse>>((ref) async =>
    (await ref.read(apiProvider).getSubjectsApi().subjectsGet()).data!);