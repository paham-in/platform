//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_create_booking_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringCreateBookingResponse {
  /// Returns a new [TutoringCreateBookingResponse] instance.
  TutoringCreateBookingResponse({

     this.classId,

     this.createdAt,

     this.date,

     this.endTime,

     this.groupToken,

     this.id,

     this.invoiceStatus,

     this.mode,

     this.note,

     this.sessionCount,

     this.startTime,

     this.status,

     this.studentId,

     this.studentName,

     this.subjectId,

     this.subjectName,

     this.teacherId,

     this.teacherName,
  });

  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



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



  @JsonKey(
    
    name: r'group_token',
    required: false,
    includeIfNull: false,
  )


  final String? groupToken;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'invoice_status',
    required: false,
    includeIfNull: false,
  )


  final String? invoiceStatus;



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
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



  @JsonKey(
    
    name: r'student_id',
    required: false,
    includeIfNull: false,
  )


  final int? studentId;



  @JsonKey(
    
    name: r'student_name',
    required: false,
    includeIfNull: false,
  )


  final String? studentName;



  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;



  @JsonKey(
    
    name: r'subject_name',
    required: false,
    includeIfNull: false,
  )


  final String? subjectName;



  @JsonKey(
    
    name: r'teacher_id',
    required: false,
    includeIfNull: false,
  )


  final int? teacherId;



  @JsonKey(
    
    name: r'teacher_name',
    required: false,
    includeIfNull: false,
  )


  final String? teacherName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringCreateBookingResponse &&
      other.classId == classId &&
      other.createdAt == createdAt &&
      other.date == date &&
      other.endTime == endTime &&
      other.groupToken == groupToken &&
      other.id == id &&
      other.invoiceStatus == invoiceStatus &&
      other.mode == mode &&
      other.note == note &&
      other.sessionCount == sessionCount &&
      other.startTime == startTime &&
      other.status == status &&
      other.studentId == studentId &&
      other.studentName == studentName &&
      other.subjectId == subjectId &&
      other.subjectName == subjectName &&
      other.teacherId == teacherId &&
      other.teacherName == teacherName;

    @override
    int get hashCode =>
        classId.hashCode +
        createdAt.hashCode +
        date.hashCode +
        endTime.hashCode +
        groupToken.hashCode +
        id.hashCode +
        invoiceStatus.hashCode +
        mode.hashCode +
        note.hashCode +
        sessionCount.hashCode +
        startTime.hashCode +
        status.hashCode +
        studentId.hashCode +
        studentName.hashCode +
        subjectId.hashCode +
        subjectName.hashCode +
        teacherId.hashCode +
        teacherName.hashCode;

  factory TutoringCreateBookingResponse.fromJson(Map<String, dynamic> json) => _$TutoringCreateBookingResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringCreateBookingResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

