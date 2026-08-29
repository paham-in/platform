import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';
import '../belajar/belajar_screen.dart' show classesProvider;
import '../forum/forum_list_screen.dart' show allSubjectsProvider;
import 'bookings_screen.dart' show bookingsProvider;

final teachersProvider = FutureProvider.autoDispose<List<TutoringListTeachersResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getTutoringApi().tutoringTeachersGet())));

class BookingFormScreen extends ConsumerStatefulWidget {
  const BookingFormScreen({super.key});

  @override
  ConsumerState<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends ConsumerState<BookingFormScreen> {
  final _noteCtrl = TextEditingController();
  int? _classId;
  int? _subjectId;
  int? _teacherId;
  DateTime? _date;
  TimeOfDay? _start;
  TimeOfDay? _end;
  int _sessionCount = 1;
  String _mode = 'individual';
  bool _submitting = false;

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickStart() async {
    final picked = await showTimePicker(context: context, initialTime: TimeOfDay(hour: 9, minute: 0));
    if (picked != null) setState(() => _start = picked);
  }

  Future<void> _pickEnd() async {
    final picked = await showTimePicker(context: context, initialTime: TimeOfDay(hour: 10, minute: 0));
    if (picked != null) setState(() => _end = picked);
  }

  String _two(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  String get _dateIso {
    final d = _date!;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  Future<void> _submit() async {
    if (_classId == null || _subjectId == null || _date == null || _start == null || _end == null) {
      showToast(context, 'Lengkapi kelas, mapel, tanggal, dan jam.');
      return;
    }
    setState(() => _submitting = true);
    try {
      await unwrap(ref.read(apiProvider).getTutoringApi().tutoringBookingsPost(
            body: TutoringCreateBookingRequest(
              classId: _classId,
              subjectId: _subjectId,
              teacherId: _teacherId,
              date: _dateIso,
              startTime: _two(_start!),
              endTime: _two(_end!),
              sessionCount: _sessionCount,
              mode: _mode,
              note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
            ),
          ));
      if (mounted) {
        showToast(context, 'Booking berhasil dibuat.');
        ref.invalidate(bookingsProvider);
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
    final theme = Theme.of(context);
    final classes = ref.watch(classesProvider);
    final subjects = ref.watch(allSubjectsProvider);
    final teachers = ref.watch(teachersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Buat Booking')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AsyncView(
            value: classes,
builder: (items) => DropdownButtonFormField<int>(
              initialValue: _classId,
              decoration: const InputDecoration(labelText: 'Kelas', border: OutlineInputBorder(), isDense: true),
              items: [for (final c in items) DropdownMenuItem(value: c.id, child: Text(c.name ?? '-'))],
              onChanged: (v) => setState(() => _classId = v),
            ),
          ),
          const SizedBox(height: 12),
          AsyncView(
            value: subjects,
builder: (items) => DropdownButtonFormField<int>(
              initialValue: _subjectId,
              decoration: const InputDecoration(labelText: 'Mata Pelajaran', border: OutlineInputBorder(), isDense: true),
              items: [for (final s in items) DropdownMenuItem(value: s.id, child: Text(s.name ?? '-'))],
              onChanged: (v) => setState(() => _subjectId = v),
            ),
          ),
          const SizedBox(height: 12),
          AsyncView(
            value: teachers,
            builder: (items) => DropdownButtonFormField<int>(
              initialValue: _teacherId,
              decoration: const InputDecoration(
                  labelText: 'Guru (opsional)', border: OutlineInputBorder(), isDense: true),
              items: [
                const DropdownMenuItem(value: null, child: Text('Otomatis')),
                for (final t in items) DropdownMenuItem(value: t.id, child: Text(t.name ?? '-')),
              ],
              onChanged: (v) => setState(() => _teacherId = v),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.calendar_today, size: 18),
                  label: Text(_date == null ? 'Pilih tanggal' : formatDate1(_date!)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickStart,
                  icon: const Icon(Icons.schedule, size: 18),
                  label: Text(_start == null ? 'Mulai' : _two(_start!)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickEnd,
                  icon: const Icon(Icons.schedule, size: 18),
                  label: Text(_end == null ? 'Selesai' : _two(_end!)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _mode,
            decoration: const InputDecoration(labelText: 'Mode', border: OutlineInputBorder(), isDense: true),
            items: const [
              DropdownMenuItem(value: 'individual', child: Text('Individual')),
              DropdownMenuItem(value: 'group', child: Text('Grup')),
            ],
            onChanged: (v) => setState(() => _mode = v ?? 'individual'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton.outlined(
                onPressed: _sessionCount > 1 ? () => setState(() => _sessionCount--) : null,
                icon: const Icon(Icons.remove),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('$_sessionCount sesi', style: theme.textTheme.titleMedium),
              ),
              IconButton.outlined(
                onPressed: () => setState(() => _sessionCount++),
                icon: const Icon(Icons.add),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _noteCtrl,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Catatan (opsional)',
              border: OutlineInputBorder(),
              isDense: true,
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.check),
            label: Text(_submitting ? 'Membuat...' : 'Buat Booking'),
          ),
        ],
      ),
    );
  }
}

String formatDate1(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}-${d.month.toString().padLeft(2, '0')}-${d.year}';
