//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'subject_admin_delete_subject_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SubjectAdminDeleteSubjectResponse {
  /// Returns a new [SubjectAdminDeleteSubjectResponse] instance.
  SubjectAdminDeleteSubjectResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is SubjectAdminDeleteSubjectResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory SubjectAdminDeleteSubjectResponse.fromJson(Map<String, dynamic> json) => _$SubjectAdminDeleteSubjectResponseFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectAdminDeleteSubjectResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

