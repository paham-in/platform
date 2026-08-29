//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_assign_teacher_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringAssignTeacherRequest {
  /// Returns a new [TutoringAssignTeacherRequest] instance.
  TutoringAssignTeacherRequest({

     this.teacherId,
  });

  @JsonKey(
    
    name: r'teacher_id',
    required: false,
    includeIfNull: false,
  )


  final int? teacherId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringAssignTeacherRequest &&
      other.teacherId == teacherId;

    @override
    int get hashCode =>
        teacherId.hashCode;

  factory TutoringAssignTeacherRequest.fromJson(Map<String, dynamic> json) => _$TutoringAssignTeacherRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringAssignTeacherRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

