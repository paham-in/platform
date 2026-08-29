import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final workQuestionsProvider =
    FutureProvider.autoDispose.family<List<QuestionpackageWorkQuestionResponse>, String>((ref, id) async =>
        (await unwrap(ref.read(apiProvider).getQuestionPackageApi().questionPackagesIdWorkQuestionsGet(id: id))));

final workProgressProvider =
    FutureProvider.autoDispose.family<QuestionpackageWorkProgressResponse, String>((ref, id) async =>
        (await unwrap(ref.read(apiProvider).getQuestionPackageApi().questionPackagesIdWorkProgressGet(id: id))));

class PackageWorkScreen extends ConsumerStatefulWidget {
  const PackageWorkScreen({super.key, required this.publicId});

  final String publicId;

  @override
  ConsumerState<PackageWorkScreen> createState() => _PackageWorkScreenState();
}

class _PackageWorkScreenState extends ConsumerState<PackageWorkScreen> {
  int _index = 0;
  final Map<int, int> _selected = {};
  final Map<int, List<int>> _correctAnswers = {};
  final Map<int, String> _explanation = {};
  bool _submitting = false;

  void _applyProgress(QuestionpackageWorkProgressResponse p) {
    _selected.addAll(p.selectedAnswers?.map((k, v) => MapEntry(int.parse(k), v)) ?? const {});
    _correctAnswers.addAll(p.correctAnswerIds?.map((k, v) => MapEntry(int.parse(k), v)) ?? const {});
    _explanation.addAll(p.explanations?.map((k, v) => MapEntry(int.parse(k), v)) ?? const {});
  }

  Future<void> _submit(QuestionpackageWorkQuestionResponse q, int answerId) async {
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      final res = await unwrap(ref.read(apiProvider).getQuestionPackageApi().questionPackagesIdWorkSubmitPost(
            id: widget.publicId,
            body: QuestionpackageSubmitAnswerInput(questionId: q.id, answerId: answerId),
          ));
      setState(() {
        _selected[q.id!] = answerId;
        _correctAnswers[q.id!] = res.correctAnswerIds ?? const [];
        _explanation[q.id!] = res.explanation ?? '';
      });
      ref.invalidate(workProgressProvider(widget.publicId));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _answerTile(QuestionpackageWorkAnswerResponse a, QuestionpackageWorkQuestionResponse q) {
    final theme = Theme.of(context);
    final selectedAnswer = _selected[q.id!];
    final answered = selectedAnswer != null;
    final isSelected = selectedAnswer == a.id;
    final correctAnswers = _correctAnswers[q.id!] ?? const <int>[];
    final isCorrectAnswer = correctAnswers.contains(a.id);

    Color? tileColor;
    IconData? correctIcon;
    if (answered) {
      if (isCorrectAnswer) {
        tileColor = theme.colorScheme.primaryContainer;
        correctIcon = Icons.check_circle;
      } else if (isSelected) {
        tileColor = theme.colorScheme.errorContainer;
        correctIcon = Icons.cancel;
      }
    }
    final isEnabled = !_submitting && !answered;

    return Card(
      color: tileColor,
      child: InkWell(
        onTap: isEnabled ? () => _submit(q, a.id!) : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(child: Text(a.content ?? '-')),
              if (correctIcon != null) Icon(correctIcon, color: theme.colorScheme.primary),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final questions = ref.watch(workQuestionsProvider(widget.publicId));
    final progress = ref.watch(workProgressProvider(widget.publicId));
    final theme = Theme.of(context);

    progress.whenData(_applyProgress);

    return Scaffold(
      appBar: AppBar(title: const Text('Mengerjakan Soal')),
      body: AsyncView(
        value: questions,
        onRetry: () => ref.invalidate(workQuestionsProvider(widget.publicId)),
        builder: (qs) {
          if (qs.isEmpty) return const EmptyState(icon: Icons.quiz_outlined, message: 'Belum ada soal.');
          final q = qs[_index.clamp(0, qs.length - 1)];
          final answered = _selected[q.id!] != null;
          return Column(
            children: [
              progress.when(
                data: (p) {
                  final total = (p.totalCount ?? 0) == 0 ? 1 : p.totalCount!;
                  return LinearProgressIndicator(value: (p.completedCount ?? 0) / total);
                },
                loading: () => const LinearProgressIndicator(value: null),
                error: (_, _) => const LinearProgressIndicator(value: null),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Row(
                  children: [
                    Text('Soal ${_index + 1} dari ${qs.length}', style: theme.textTheme.titleSmall),
                    const Spacer(),
                    Text(answered ? 'Terjawab' : 'Belum dijawab',
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: answered ? theme.colorScheme.primary : theme.colorScheme.error)),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(stripHtmlForWork(q.question), style: theme.textTheme.titleMedium?.copyWith(height: 1.5)),
                    const SizedBox(height: 16),
                    for (final a in q.answers ?? const []) ...[
                      _answerTile(a, q),
                      const SizedBox(height: 8),
                    ],
                    if (answered && _explanation[q.id!]?.isNotEmpty == true) ...[
                      const SizedBox(height: 8),
                      Card(
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text('Pembahasan: ${_explanation[q.id!]}',
                              style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _index > 0 ? () => setState(() => _index--) : null,
                          icon: const Icon(Icons.chevron_left),
                          label: const Text('Sebelumnya'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _index < qs.length - 1 ? () => setState(() => _index++) : null,
                          icon: const Icon(Icons.chevron_right),
                          label: Text(_index < qs.length - 1 ? 'Berikutnya' : 'Selesai'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

String stripHtmlForWork(String? html) {
  if (html == null || html.isEmpty) return '';
  return html
      .replaceAll(RegExp(r'<[^>]+>'), ' ')
      .replaceAll(RegExp(r'&nbsp;'), ' ')
      .replaceAll(RegExp(r'&amp;'), '&')
      .replaceAll(RegExp(r'&lt;'), '<')
      .replaceAll(RegExp(r'&gt;'), '>')
      .replaceAll(RegExp(r'&quot;'), '"')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}