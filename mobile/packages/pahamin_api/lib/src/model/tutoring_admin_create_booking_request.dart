//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_admin_create_booking_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringAdminCreateBookingRequest {
  /// Returns a new [TutoringAdminCreateBookingRequest] instance.
  TutoringAdminCreateBookingRequest({

     this.classId,

     this.date,

     this.endTime,

     this.memberEmails,

     this.mode,

     this.note,

     this.sessionCount,

     this.startTime,

     this.studentId,

     this.subjectId,

     this.teacherId,
  });

  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'date',
    required: false,
    includeIfNull: false,
  )


  final String? date;



  @JsonKey(
    
    name: r'end_time',
    required: false,
    includeIfNull: false,
  )


  final String? endTime;



      /// group: email member (wajib ≥1)
  @JsonKey(
    
    name: r'member_emails',
    required: false,
    includeIfNull: false,
  )


  final List<String>? memberEmails;



      /// private/group
  @JsonKey(
    
    name: r'mode',
    required: false,
    includeIfNull: false,
  )


  final String? mode;



  @JsonKey(
    
    name: r'note',
    required: false,
    includeIfNull: false,
  )


  final String? note;



      /// jumlah pertemuan (default 1)
  @JsonKey(
    
    name: r'session_count',
    required: false,
    includeIfNull: false,
  )


  final int? sessionCount;



  @JsonKey(
    
    name: r'start_time',
    required: false,
    includeIfNull: false,
  )


  final String? startTime;



  @JsonKey(
    
    name: r'student_id',
    required: false,
    includeIfNull: false,
  )


  final int? studentId;



  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;



  @JsonKey(
    
    name: r'teacher_id',
    required: false,
    includeIfNull: false,
  )


  final int? teacherId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringAdminCreateBookingRequest &&
      other.classId == classId &&
      other.date == date &&
      other.endTime == endTime &&
      other.memberEmails == memberEmails &&
      other.mode == mode &&
      other.note == note &&
      other.sessionCount == sessionCount &&
      other.startTime == startTime &&
      other.studentId == studentId &&
      other.subjectId == subjectId &&
      other.teacherId == teacherId;

    @override
    int get hashCode =>
        classId.hashCode +
        date.hashCode +
        endTime.hashCode +
        memberEmails.hashCode +
        mode.hashCode +
        note.hashCode +
        sessionCount.hashCode +
        startTime.hashCode +
        studentId.hashCode +
        subjectId.hashCode +
        teacherId.hashCode;

  factory TutoringAdminCreateBookingRequest.fromJson(Map<String, dynamic> json) => _$TutoringAdminCreateBookingRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringAdminCreateBookingRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

