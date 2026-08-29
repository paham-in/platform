//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'subject_admin_update_subject_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SubjectAdminUpdateSubjectRequest {
  /// Returns a new [SubjectAdminUpdateSubjectRequest] instance.
  SubjectAdminUpdateSubjectRequest({

     this.classIds,

     this.name,

     this.programId,
  });

  @JsonKey(
    
    name: r'class_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? classIds;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'program_id',
    required: false,
    includeIfNull: false,
  )


  final int? programId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is SubjectAdminUpdateSubjectRequest &&
      other.classIds == classIds &&
      other.name == name &&
      other.programId == programId;

    @override
    int get hashCode =>
        classIds.hashCode +
        name.hashCode +
        programId.hashCode;

  factory SubjectAdminUpdateSubjectRequest.fromJson(Map<String, dynamic> json) => _$SubjectAdminUpdateSubjectRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectAdminUpdateSubjectRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

