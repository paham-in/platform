//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/program_class_info.dart';
import 'package:json_annotation/json_annotation.dart';

part 'program_program_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramProgramResponse {
  /// Returns a new [ProgramProgramResponse] instance.
  ProgramProgramResponse({

     this.classes,

     this.createdAt,

     this.description,

     this.id,

     this.name,

     this.slug,
  });

  @JsonKey(
    
    name: r'classes',
    required: false,
    includeIfNull: false,
  )


  final List<ProgramClassInfo>? classes;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'slug',
    required: false,
    includeIfNull: false,
  )


  final String? slug;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ProgramProgramResponse &&
      other.classes == classes &&
      other.createdAt == createdAt &&
      other.description == description &&
      other.id == id &&
      other.name == name &&
      other.slug == slug;

    @override
    int get hashCode =>
        classes.hashCode +
        createdAt.hashCode +
        description.hashCode +
        id.hashCode +
        name.hashCode +
        slug.hashCode;

  factory ProgramProgramResponse.fromJson(Map<String, dynamic> json) => _$ProgramProgramResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramProgramResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

