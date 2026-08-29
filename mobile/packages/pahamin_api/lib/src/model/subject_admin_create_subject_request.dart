//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'subject_admin_create_subject_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SubjectAdminCreateSubjectRequest {
  /// Returns a new [SubjectAdminCreateSubjectRequest] instance.
  SubjectAdminCreateSubjectRequest({

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
    bool operator ==(Object other) => identical(this, other) || other is SubjectAdminCreateSubjectRequest &&
      other.classIds == classIds &&
      other.name == name &&
      other.programId == programId;

    @override
    int get hashCode =>
        classIds.hashCode +
        name.hashCode +
        programId.hashCode;

  factory SubjectAdminCreateSubjectRequest.fromJson(Map<String, dynamic> json) => _$SubjectAdminCreateSubjectRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectAdminCreateSubjectRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

